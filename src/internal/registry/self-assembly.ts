/**
 * Domain-module self-assembly (`BACKLOG.md` B1 refinement; `ARCHITECTURE.md`
 * Item 5's self-assembly recommendation, concretized by `BACKLOG.md`'s "B1"
 * implementation-detail refinement note).
 *
 * ## Domain export convention (binding on every future `src/domains/<family>.ts`)
 *
 * Every domain module discovered under `src/domains/*.ts` MUST have exactly
 * this one named export:
 *
 * ```ts
 * export const operations: readonly TypedOperation<never, unknown>[] = [
 *   defineOperationLikeDescriptorHere,
 * ];
 * ```
 *
 * - The export name is exactly `operations` — no default export, no other
 *   export name, no nested/namespaced shape.
 * - Its value is a flat, readonly array of `TypedOperation<never, unknown>`
 *   descriptors (see `./operation.ts`), one per real documented command the
 *   family implements (`ARCHITECTURE.md` Item 5's "one `defineOperation` per
 *   entry").
 * - Every `manifestId` referenced must already exist in the generated
 *   `capabilityManifest` — an operation whose `manifestId` is absent fails at
 *   generation time (see `buildSelfAssembledRegistry` below), mirroring
 *   `ARCHITECTURE.md` Item 5's "fails at test time" requirement one layer
 *   earlier, at the point the aggregator is (re)generated.
 * - Two domain files must never register the same `manifestId`; this is a
 *   generation-time error (reuses `assembleOperationRegistry`'s existing
 *   duplicate-id rejection, not reimplemented here).
 *
 * This is a deliberately separate concern from manifest-corpus parsing (own
 * module, own responsibility, per the existing SRP note against entangling
 * manifest-corpus-reading with domain-discovery): this module never reads the
 * CLI/WebUI corpora and knows nothing about
 * `.ai/skills/vigor3912s/references/*`; it only discovers and assembles
 * domain-module operations, and overlays their implemented status onto an
 * already-built manifest array.
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { CapabilityEntry } from "../../manifest/types.js";
import { assembleOperationRegistry, findRegistryManifestInvariantViolations } from "./registry.js";
import type { OperationRegistry, TypedOperation } from "./operation.js";

/** The well-defined export shape every `src/domains/<family>.ts` module must satisfy. */
export interface DomainModule {
  readonly operations: readonly TypedOperation<never, unknown>[];
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code: unknown }).code === "ENOENT"
  );
}

function isTypedOperationShaped(value: unknown): value is TypedOperation<never, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.manifestId === "string" &&
    (candidate.classification === "read" ||
      candidate.classification === "write" ||
      candidate.classification === "destructive") &&
    typeof candidate.buildFrames === "function" &&
    typeof candidate.parse === "function"
  );
}

function assertIsDomainModule(value: unknown, fileName: string): DomainModule {
  const hasOperationsExport = typeof value === "object" && value !== null && "operations" in value;

  if (!hasOperationsExport) {
    throw new Error(
      `Domain module "${fileName}" does not export "operations". Every src/domains/*.ts module ` +
        "must export exactly `operations: readonly TypedOperation<never, unknown>[]` " +
        "(see internal/registry/self-assembly.ts for the full convention).",
    );
  }

  const { operations } = value as { readonly operations: unknown };

  if (!Array.isArray(operations) || !operations.every(isTypedOperationShaped)) {
    throw new Error(
      `Domain module "${fileName}"'s "operations" export must be a readonly array of ` +
        'TypedOperation descriptors (manifestId: string, classification: "read" | "write" | ' +
        '"destructive", buildFrames: function, parse: function).',
    );
  }

  return { operations };
}

/**
 * Lists `*.ts` files directly under `domainsDir`, sorted for deterministic
 * aggregation order. A missing directory (e.g. `src/domains/` not created
 * yet, before Wave 4 starts) is treated as zero domain files, not an error.
 */
export async function listDomainModuleFiles(domainsDir: string): Promise<readonly string[]> {
  try {
    const entries = await readdir(domainsDir, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (isEnoent(error)) {
      return [];
    }

    throw error;
  }
}

/**
 * Dynamically imports every discovered domain module file (sorted, so
 * aggregation order is deterministic) and concatenates their `operations`
 * exports.
 *
 * `domainsDir` is always the source `src/domains/` directory (or a `.ts`
 * fixture directory in tests) used to enumerate `.ts` file names — that
 * listing is the single source of truth for "which domains exist" and for
 * the base names used when rendering `registry.generated.ts`'s import
 * statements.
 *
 * `importDir`, when given, is a *different* directory to actually `import()`
 * each discovered module from, with the same base names but a `.js`
 * extension. This exists because plain `node --experimental-strip-types`
 * (used by `tools/generate-capability-manifest.ts` at generation time) only
 * strips types for the file it directly loads — it does not remap a `.js`
 * specifier inside that file to a sibling `.ts` file. A real domain module
 * with any non-type-only import (e.g. `frameSingleCommand` from
 * `internal/execution/framing.js`) therefore fails to resolve if imported
 * directly from `src/domains/*.ts` at raw-Node runtime. Passing the
 * `tsconfig.generator.json`-compiled `dist/domains/` here (real, sibling-
 * resolvable `.js` files) avoids that failure. Tests, which run under
 * Vitest's own transform (not plain `node --experimental-strip-types`), omit
 * `importDir` and import their `.ts` fixtures directly — unaffected by this
 * runtime-only concern.
 */
export async function discoverDomainOperations(
  domainsDir: string,
  importDir?: string,
): Promise<readonly TypedOperation<never, unknown>[]> {
  const fileNames = await listDomainModuleFiles(domainsDir);
  const operations: TypedOperation<never, unknown>[] = [];

  for (const fileName of fileNames) {
    const filePath =
      importDir === undefined
        ? path.join(domainsDir, fileName)
        : path.join(importDir, fileName.replace(/\.ts$/, ".js"));
    const imported: unknown = await import(pathToFileURL(filePath).href);
    const domainModule = assertIsDomainModule(imported, fileName);

    operations.push(...domainModule.operations);
  }

  return operations;
}

/**
 * Assembles the self-assembled registry from discovered domain operations,
 * reusing `assembleOperationRegistry` (duplicate-id rejection) and
 * `findRegistryManifestInvariantViolations` (unknown-manifest-id detection)
 * unchanged. Throws at generation time when a domain operation references a
 * `manifestId` absent from `manifest` — mirroring `ARCHITECTURE.md` Item 5's
 * "a manifestId that is absent... fails at test time" requirement, applied
 * one layer earlier at aggregator-generation time.
 */
export function buildSelfAssembledRegistry(
  operations: readonly TypedOperation<never, unknown>[],
  manifest: readonly CapabilityEntry[],
): OperationRegistry {
  const registry = assembleOperationRegistry(operations);
  const violations = findRegistryManifestInvariantViolations(registry, manifest);
  const unknownIds = violations
    .filter((violation) => violation.kind === "unknown-manifest-id")
    .map((violation) => violation.manifestId);

  if (unknownIds.length > 0) {
    throw new Error(
      "Domain module(s) registered a TypedOperation whose manifestId does not exist in the " +
        `capability manifest: ${unknownIds.map((id) => `"${id}"`).join(", ")}.`,
    );
  }

  return registry;
}

/**
 * Overlays `status: "implemented"` + `operationIds: [id]` onto every manifest
 * entry with a matching self-assembled registry entry. Every other entry
 * (no registry entry) is returned unchanged, preserving its prior status
 * (`"documented"` / `"blocked-by-documentation"`).
 *
 * `buildSelfAssembledRegistry` already guarantees every registry key exists
 * in `manifest`, so this never introduces an orphan id.
 */
export function overlayImplementedStatus(
  manifest: readonly CapabilityEntry[],
  registry: OperationRegistry,
): readonly CapabilityEntry[] {
  return manifest.map((entry): CapabilityEntry => {
    if (!registry.has(entry.id)) {
      return entry;
    }

    return { ...entry, status: "implemented", operationIds: [entry.id] };
  });
}

function domainModuleIdentifier(fileName: string, index: number): string {
  const base = fileName.replace(/\.ts$/, "");
  const camelCased = base.replace(/[-_]+([a-zA-Z0-9])/g, (_match, char: string) =>
    char.toUpperCase(),
  );
  const isValidIdentifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(camelCased);

  return `${isValidIdentifier ? camelCased : `domain${String(index)}`}Operations`;
}

/**
 * Renders the generated `internal/registry/registry.generated.ts` source
 * (real TypeScript, not JSON — `TypedOperation`s carry functions, which
 * cannot round-trip through `JSON.stringify`). Pure and deterministic given
 * `domainFileNames`, so it is directly unit-testable without touching the
 * filesystem or dynamically importing anything.
 */
export function renderRegistryModule(domainFileNames: readonly string[]): string {
  const imports = domainFileNames
    .map((fileName, index) => {
      const base = fileName.replace(/\.ts$/, "");
      const identifier = domainModuleIdentifier(fileName, index);

      return `import { operations as ${identifier} } from "../../domains/${base}.js";`;
    })
    .join("\n");

  const spreadEntries = domainFileNames
    .map((fileName, index) => `  ...${domainModuleIdentifier(fileName, index)},`)
    .join("\n");

  return `/**
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by \`tools/generate-capability-manifest.ts\` by \`readdir\`-ing
 * \`src/domains/*.ts\` and assembling every discovered module's \`operations\`
 * export via \`assembleOperationRegistry\` (see \`self-assembly.ts\` for the
 * required domain export convention).
 *
 * Regenerate with \`npm run manifest:generate\`; drift is caught by
 * \`npm run manifest:check\` (folded into \`npm run verify\`).
 */

${imports.length > 0 ? `${imports}\n\n` : ""}import { assembleOperationRegistry } from "./registry.js";
import type { OperationRegistry } from "./operation.js";

export const operationRegistry: OperationRegistry = assembleOperationRegistry([
${spreadEntries}
]);
`;
}
