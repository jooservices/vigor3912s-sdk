/**
 * Shared test support for `tests/domains/nand/*.test.ts` -- the fixed
 * four-test convention's manifest-linkage step (`ARCHITECTURE.md` Item 5).
 * Not a test file itself (no `.test.ts` suffix), scoped entirely within this
 * family's own write scope (`tests/domains/nand/**`). Mirrors
 * `tests/domains/wan/support.ts`'s precedent for this same problem.
 */

import { expect } from "vitest";

import { buildSelfAssembledRegistry } from "../../../src/internal/registry/self-assembly.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { CommandFrame } from "../../../src/internal/execution/framing.js";
import { DefaultCommandRunner } from "../../../src/internal/execution/default-runner.js";
import { capabilityManifest as generatedManifest } from "../../../src/manifest/capability-manifest.generated.js";
import type { CapabilityEntry, Classification } from "../../../src/manifest/types.js";
import { FakeTransport, exchange } from "../../support/fake-transport.js";

export function firstFrame(frames: readonly unknown[]): CommandFrame {
  const [frame] = frames as readonly CommandFrame[];

  if (frame === undefined) {
    throw new Error("Expected buildFrames() to return at least one frame.");
  }

  return frame;
}

export const capabilityManifest: readonly CapabilityEntry[] = generatedManifest;

export function findManifestEntry(id: string): CapabilityEntry {
  const entry = capabilityManifest.find((candidate) => candidate.id === id);

  if (entry === undefined) {
    throw new Error(`No manifest entry found for id "${id}".`);
  }

  return entry;
}

export function expectManifestLinkage(
  operation: TypedOperation<never, unknown>,
  expectedClassification: Classification,
): void {
  const entry = findManifestEntry(operation.manifestId);

  expect(entry.classification).toBe(expectedClassification);
  expect(entry.kind).toBe("cli-command");

  const registry = buildSelfAssembledRegistry([operation], capabilityManifest);

  expect(registry.get(operation.manifestId)).toBe(operation);
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
