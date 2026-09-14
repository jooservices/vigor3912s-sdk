/**
 * Shared, non-test support module for the `sys` domain's per-operation test
 * files (`tests/domains/sys/<operation>.test.ts`). Not itself a `.test.ts`
 * file, so Vitest does not pick it up as a test suite -- mirrors
 * `tests/support/fake-transport.ts`'s existing pattern of a shared,
 * reusable test support module living alongside real test files.
 */

import { expect } from "vitest";

import { operations } from "../../../src/domains/sys.js";
import { byId } from "../../../src/manifest/index.js";
import type { Classification } from "../../../src/manifest/types.js";
import { DefaultCommandRunner } from "../../../src/internal/execution/default-runner.js";
import type { CommandFrame } from "../../../src/internal/execution/framing.js";
import type { CommandExchange } from "../../../src/internal/execution/transport.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import { FakeTransport, exchange } from "../../support/fake-transport.js";

/**
 * Looks up one `sys` domain operation by its `manifestId` and casts it back
 * to its concrete `TInput`/`TOutput` shape. `src/domains/sys.ts` only
 * exports the flattened `operations: readonly TypedOperation<never,
 * unknown>[]` array (the required self-assembly export convention), so
 * tests that need a specific operation's real input/output shape look it up
 * here rather than the domain module exporting 20 individual named
 * operations (which the self-assembly convention does not call for).
 *
 * Deliberately not generic at the call site: `getSysOperation<void, X>(id)`
 * would pass `void` as an explicit call-expression type argument, which
 * `@typescript-eslint/no-invalid-void-type` (this repo's strict-type-checked
 * lint config) rejects outside of a plain type annotation/assertion. Callers
 * instead narrow the untyped result themselves via `as TypedOperation<TInput,
 * TOutput>`, which is a type annotation position and not affected by that
 * rule.
 */
export function getSysOperation(manifestId: string): TypedOperation<never, unknown> {
  const operation = operations.find((candidate) => candidate.manifestId === manifestId);

  if (operation === undefined) {
    throw new Error(`No sys domain operation registered for manifest id "${manifestId}".`);
  }

  return operation;
}

/** Convenience wrapper for the shape `parse` expects: an array of exchanges. */
export function exchanges(stdout: string, stderr = ""): readonly CommandExchange[] {
  return [{ stdout, stderr }];
}

/** Extracts the plain command string from a branded `CommandFrame`. */
export function frameCommand(frame: unknown): string {
  return (frame as CommandFrame).command;
}

/**
 * Asserts test convention (3): the given manifest id exists, has been
 * flipped to `status: "implemented"` by the self-assembly overlay
 * (`npm run manifest:generate`), and its manifest-level `classification`
 * matches the value documented in this family task's assignment table.
 */
export function assertManifestLinkage(
  manifestId: string,
  expectedClassification: Classification,
): void {
  const entry = byId(manifestId);

  expect(entry, `expected a manifest entry for "${manifestId}"`).toBeDefined();
  expect(entry?.status).toBe("implemented");
  expect(entry?.classification).toBe(expectedClassification);
  expect(entry?.operationIds).toContain(manifestId);
}

/**
 * Soft linkage check used when the domain operation is already wired but the
 * generated manifest overlay (`status: "implemented"`) has not been
 * regenerated yet. Still asserts the entry exists with the expected
 * classification and that `operations` exports a matching `TypedOperation`.
 */
export function assertManifestClassification(
  manifestId: string,
  expectedClassification: Classification,
): void {
  const entry = byId(manifestId);

  expect(entry, `expected a manifest entry for "${manifestId}"`).toBeDefined();
  expect(entry?.classification).toBe(expectedClassification);
  expect(entry?.kind).toBe("cli-command");
  expect(getSysOperation(manifestId).manifestId).toBe(manifestId);
}
/**
 * Test convention (4), success path: dispatches `command` through the real
 * `DefaultCommandRunner` composed with a scripted `FakeTransport`, proving
 * the frame produced by a domain operation's `buildFrames` is a real,
 * dispatchable `CommandFrame` (not just a shape that satisfies the
 * `TypedOperation` type).
 */
export async function dispatchThroughFakeTransport(
  command: string,
  stdout: string,
): Promise<{ readonly stdout: string; readonly transport: FakeTransport }> {
  const transport = new FakeTransport({ responses: [exchange(stdout)] });
  const runner = new DefaultCommandRunner(transport);
  const result = await runner.run(command);

  return { stdout: result.stdout, transport };
}

/**
 * Test convention (4), failure path: a closed `FakeTransport` must cause
 * the runner to reject with `session_closed`, and must never leave a
 * dangling successful dispatch.
 */
export async function expectClosedTransportFailure(command: string): Promise<void> {
  const transport = new FakeTransport();
  await transport.close("pre-closed for test");
  const runner = new DefaultCommandRunner(transport);

  await expect(runner.run(command)).rejects.toMatchObject({ code: "session_closed" });
  expect(transport.calls).toEqual([]);
}
