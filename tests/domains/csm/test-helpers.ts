/**
 * Shared test-helper module for `tests/domains/csm/<operation>.test.ts`'s
 * fixed four-test convention's 4th step (fake-transport round-trip +
 * closed-session failure). Not itself a `.test.ts` file, so Vitest does not
 * pick it up as a test suite -- mirrors `tests/domains/sys/test-helpers.ts`'s
 * existing pattern.
 */

import { expect } from "vitest";

import { DefaultCommandRunner } from "../../../src/internal/execution/default-runner.js";
import { FakeTransport, exchange } from "../../support/fake-transport.js";

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
