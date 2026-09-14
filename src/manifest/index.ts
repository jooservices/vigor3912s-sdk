/**
 * Typed accessors over the generated capability manifest.
 *
 * Per `ARCHITECTURE.md`'s cross-cutting layout: `src/manifest/index.ts`
 * exposes `byId`, `byClassification`, `counts`. No manifest data or
 * generation logic lives here — see `capability-manifest.generated.ts`
 * (produced by `tools/generate-capability-manifest.ts`).
 */

import { capabilityManifest } from "./capability-manifest.generated.js";
import type { CapabilityEntry, CapabilityStatus, Classification } from "./types.js";

export { capabilityManifest };
export type * from "./types.js";

const manifestById: ReadonlyMap<string, CapabilityEntry> = new Map(
  capabilityManifest.map((entry) => [entry.id, entry] as const),
);

/** Looks up a single manifest entry by its stable `id`. */
export function byId(id: string): CapabilityEntry | undefined {
  return manifestById.get(id);
}

/** Returns every manifest entry with the given `classification`. */
export function byClassification(classification: Classification): readonly CapabilityEntry[] {
  return capabilityManifest.filter((entry) => entry.classification === classification);
}

function countBy<TKey extends string>(
  entries: readonly CapabilityEntry[],
  selector: (entry: CapabilityEntry) => TKey,
): Readonly<Record<TKey, number>> {
  const tally = new Map<TKey, number>();

  for (const entry of entries) {
    const key = selector(entry);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }

  return Object.fromEntries(tally) as Record<TKey, number>;
}

/** Aggregate counts over the whole manifest, by kind, status, and classification. */
export const counts = {
  total: capabilityManifest.length,
  byKind: countBy(capabilityManifest, (entry) => entry.kind),
  byStatus: countBy(capabilityManifest, (entry) => entry.status) as Readonly<
    Partial<Record<CapabilityStatus, number>>
  >,
  byClassification: countBy(capabilityManifest, (entry) => entry.classification) as Readonly<
    Partial<Record<Classification, number>>
  >,
} as const;
