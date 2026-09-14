/**
 * Local helpers shared only within `tests/domains/linux/**` (this family's
 * own write scope -- not a cross-family shared file; mirrors
 * `tests/domains/show/test-helpers.ts`'s precedent). Composes the real
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
  input: never,
  stdout: string,
  stderr = "",
): Promise<TOutput> {
  const transport = new FakeTransport({ responses: [exchange(stdout, stderr)] });
  const runner = new DefaultCommandRunner(transport);

  const frames = operation.buildFrames(input);
  expect(frames).toHaveLength(1);

  const exchanges: CommandExchange[] = [];
  for (const frame of frames) {
    const result = await runner.run(frame.command);
    exchanges.push({ stdout: result.stdout, stderr: result.stderr });
  }

  return operation.parse(exchanges);
}

/**
 * Extracts the single frame's literal command string for frame-construction
 * assertions. `input` is typed `never` to mirror `TypedOperation<never,
 * unknown>`'s widened shape (see `src/domains/show.ts`'s original precedent);
 * call sites with real input pass `someInput as never` deliberately, the
 * same cast the widened registry array itself requires.
 */
export function singleFrameCommand(
  operation: TypedOperation<never, unknown>,
  input: never,
): string {
  const frames = operation.buildFrames(input);
  expect(frames).toHaveLength(1);
  return (frames[0] as unknown as { command: string }).command;
}

/** Finds an operation by manifest id, failing loudly if the domain module dropped it. */
export function findLinuxOperation(
  operations: readonly TypedOperation<never, unknown>[],
  manifestId: string,
): TypedOperation<never, unknown> {
  const operation = operations.find((candidate) => candidate.manifestId === manifestId);

  if (operation === undefined) {
    throw new Error(`Operation "${manifestId}" not registered by src/domains/linux.ts.`);
  }

  return operation;
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
