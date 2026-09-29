/**
 * Operation-usage recording for the feature census (owner requirement
 * 2026-09-29: every operation's `buildFrames` AND `parse` must be executed by
 * some unit test). Loaded as a Vitest `setupFiles` entry: it wraps every
 * registry operation in the current test file's module graph, records which
 * ones the file actually executes (failing any build whose input the
 * generated schema would reject), and writes one JSON record per test file
 * into `.op-usage/`. `tools/check-operation-usage.ts` evaluates the union
 * after the full suite (`npm test`).
 */

import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll } from "vitest";

import { operationRegistry } from "../../src/internal/registry/registry.generated.js";
import { inputSchemaFor, schemaProblem } from "../../src/schemas/index.js";
import { OPERATION_USAGE_DIR } from "./operation-usage-dir.js";

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const built = new Set<string>();
const parsed = new Set<string>();
/** Every command string an operation built during this test file (sub-form census). */
const commands = new Set<string>();

/**
 * Makes the recording wrapper indistinguishable from the original for tests
 * that introspect an operation function (`length`, source text).
 */
function transparent<T extends (...args: never[]) => unknown>(wrapper: T, original: T): T {
  Object.defineProperty(wrapper, "length", { value: original.length });
  Object.defineProperty(wrapper, "toString", { value: () => original.toString() });
  return wrapper;
}

for (const operation of operationRegistry.values()) {
  const target = operation as Mutable<typeof operation>;
  const { buildFrames, parse, manifestId } = operation;

  target.buildFrames = transparent((input) => {
    built.add(manifestId);
    const frames = buildFrames(input);
    const schema = inputSchemaFor(manifestId);
    const problem =
      schema === null || schema === undefined ? undefined : schemaProblem(input, schema);

    // Schema/validator agreement: `invoke` checks the schema first, so an
    // input the builder accepts but the schema rejects could never run.
    if (problem !== undefined) {
      throw new Error(`${manifestId}: builder accepts an input its schema rejects — ${problem}`);
    }

    for (const frame of frames) {
      commands.add(frame.command);
    }

    return frames;
  }, buildFrames);
  target.parse = transparent((exchanges) => {
    parsed.add(manifestId);
    return parse(exchanges);
  }, parse);
}

afterAll(() => {
  if (built.size === 0 && parsed.size === 0) {
    return;
  }

  mkdirSync(OPERATION_USAGE_DIR, { recursive: true });
  writeFileSync(
    path.join(OPERATION_USAGE_DIR, `${randomUUID()}.json`),
    JSON.stringify({ buildFrames: [...built], parse: [...parsed], commands: [...commands] }),
  );
});
