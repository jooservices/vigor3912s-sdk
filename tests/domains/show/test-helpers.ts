/**
 * Local helpers shared only within `tests/domains/show/**` (this family's
 * own write scope -- not a cross-family shared file). Composes the real
 * `DefaultCommandRunner` with the shared `FakeTransport`
 * (`tests/support/fake-transport.ts`) so test 4 of the fixed four-test
 * convention (`ARCHITECTURE.md` Item 5) exercises an operation's
 * `buildFrames`/`parse` round trip through the actual execution seam, never
 * a real transport.
 */

import { expect } from "vitest";

import { DefaultCommandRunner } from "../../../src/internal/execution/default-runner.js";
import type { CommandExchange } from "../../../src/internal/execution/transport.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import { FakeTransport, exchange } from "../../support/fake-transport.js";

/**
 * Runs `operation` end-to-end against a `FakeTransport` that answers with
 * `stdout`/`stderr`, mirroring `LiveReadOnlyClient#invoke`'s real frame ->
 * transport -> parse composition (`src/live/live-read-only-client.ts`).
 */
export async function runOperationAgainstFakeTransport<TOutput>(
  operation: TypedOperation<never, TOutput>,
  stdout: string,
  stderr = "",
): Promise<TOutput> {
  const transport = new FakeTransport({ responses: [exchange(stdout, stderr)] });
  const runner = new DefaultCommandRunner(transport);

  const frames = operation.buildFrames(undefined as never);
  expect(frames).toHaveLength(1);

  const exchanges: CommandExchange[] = [];
  for (const frame of frames) {
    const result = await runner.run(frame.command);
    exchanges.push({ stdout: result.stdout, stderr: result.stderr });
  }

  return operation.parse(exchanges);
}

/** Extracts the single frame's literal command string for frame-construction assertions. */
export function singleFrameCommand(operation: TypedOperation<never, unknown>): string {
  const frames = operation.buildFrames(undefined as never);
  expect(frames).toHaveLength(1);
  return (frames[0] as unknown as { command: string }).command;
}
