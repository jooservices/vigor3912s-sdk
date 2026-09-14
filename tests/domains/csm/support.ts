/**
 * Shared test support for `tests/domains/csm/*.test.ts` -- the fixed
 * four-test convention's manifest-linkage step (`ARCHITECTURE.md` Item 5).
 * Not a test file itself (no `.test.ts` suffix), scoped entirely within this
 * family's own write scope (`tests/domains/csm/**`).
 */

import { expect } from "vitest";

import { buildSelfAssembledRegistry } from "../../../src/internal/registry/self-assembly.js";
import type { TypedOperation } from "../../../src/internal/registry/operation.js";
import type { CommandFrame } from "../../../src/internal/execution/framing.js";
import { capabilityManifest as generatedManifest } from "../../../src/manifest/capability-manifest.generated.js";
import type { CapabilityEntry, Classification } from "../../../src/manifest/types.js";

/**
 * `TypedOperation.buildFrames` is declared to return `readonly unknown[]`
 * (`internal/registry/operation.ts`'s deliberate Wave-2 placeholder, not yet
 * tightened to `CommandFrame`). Every real domain `buildFrames` in fact
 * returns `CommandFrame`s (`frameSingleCommand`'s branded output) -- this
 * helper is the one place tests narrow that back, instead of repeating an
 * `as readonly CommandFrame[]` cast in every test file.
 */
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

/**
 * Proves manifest linkage (`ARCHITECTURE.md` Item 5's four-test convention,
 * step 3): the manifest entry exists with the expected classification, and
 * the operation self-assembles into a registry that maps its own id back to
 * itself (reusing the real `buildSelfAssembledRegistry`/manifest-invariant
 * machinery, not a hand-rolled duplicate check).
 */
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
