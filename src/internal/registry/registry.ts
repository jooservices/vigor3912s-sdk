/**
 * Operation registry assembly + manifest cross-check invariants.
 *
 * Mirrors `ARCHITECTURE.md`'s "Item 2" registry shape ("Registry is a frozen
 * map assembled from domain modules") and its two invariant tests (amended
 * 2026-09-13: the manifest no longer has an `excluded-by-safety` status —
 * `"destructive"` is classification metadata only, not an exclusion
 * mechanism; see `ARCHITECTURE.md`'s amendment note):
 *   1. every registry key exists in the manifest (any classification,
 *      including `"destructive"`);
 *   2. every manifest entry with `status: "implemented"` has >=1 registry
 *      entry.
 *
 * `registry.generated.ts` (self-assembled from `src/domains/*.ts` by
 * `tools/generate-capability-manifest.ts`) is built with these functions and
 * checked against the generated manifest.
 */

import type { CapabilityEntry } from "../../manifest/types.js";
import type { OperationRegistry, TypedOperation } from "./operation.js";

/**
 * Assembles a read-only registry map from a list of typed-operation
 * descriptors. Rejects duplicate `manifestId`s so a later, real
 * self-assembling aggregator cannot silently shadow one domain's operation
 * with another's.
 */
export function assembleOperationRegistry(
  operations: readonly TypedOperation<never, unknown>[],
): OperationRegistry {
  const entries = new Map<string, TypedOperation<never, unknown>>();

  for (const operation of operations) {
    if (entries.has(operation.manifestId)) {
      throw new Error(
        `Duplicate typed operation registered for manifest id "${operation.manifestId}".`,
      );
    }

    entries.set(operation.manifestId, operation);
  }

  return entries;
}

export type RegistryManifestInvariantViolationKind =
  "unknown-manifest-id" | "missing-registry-entry";

export interface RegistryManifestInvariantViolation {
  readonly kind: RegistryManifestInvariantViolationKind;
  readonly manifestId: string;
}

/**
 * Pure cross-check between an assembled registry and a manifest entry list.
 * Returns every invariant violation found (empty when both invariants hold).
 *
 * Generic over `readonly CapabilityEntry[]` so tests can exercise it with a
 * hand-built fixture array as well as the real `capabilityManifest`.
 */
export function findRegistryManifestInvariantViolations(
  registry: OperationRegistry,
  manifest: readonly CapabilityEntry[],
): readonly RegistryManifestInvariantViolation[] {
  const violations: RegistryManifestInvariantViolation[] = [];
  const manifestById = new Map(manifest.map((entry) => [entry.id, entry] as const));

  for (const manifestId of registry.keys()) {
    const entry = manifestById.get(manifestId);

    if (entry === undefined) {
      violations.push({ kind: "unknown-manifest-id", manifestId });
    }
  }

  for (const entry of manifest) {
    if (entry.status === "implemented" && !registry.has(entry.id)) {
      violations.push({ kind: "missing-registry-entry", manifestId: entry.id });
    }
  }

  return violations;
}
