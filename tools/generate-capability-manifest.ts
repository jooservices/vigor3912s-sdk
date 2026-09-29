/**
 * Capability manifest generator (`ARCHITECTURE.md` Item 1) + self-assembling
 * operation registry aggregator (`ARCHITECTURE.md` Item 5, `BACKLOG.md` B1
 * refinement).
 *
 * Manual tool — not part of `npm test`/`npm run verify` directly. Run via
 * `npm run manifest:generate` to (re)write, in one run:
 *   - `src/manifest/capability-manifest.generated.ts` (corpus-derived
 *     manifest, overlaid with `status: "implemented"`/`operationIds` for
 *     every id that has a self-assembled registry entry — see the "Domain
 *     self-assembly" section below);
 *   - `src/internal/registry/registry.generated.ts` (the self-assembled
 *     `OperationRegistry`, aggregated from `src/domains/*.ts`).
 * `npm run manifest:check` detects drift in *both* generated files between
 * what is committed and what this tool would produce today (see `--check`
 * below).
 *
 * Inputs (read-only, never modified, never embedded beyond location
 * citations):
 *   - `references/cli-reference-raw.txt` (vendored Part VIII CLI corpus).
 *   - `references/webui-index.md` (vendored WebUI capture INDEX).
 *   - `src/domains/*.ts` (domain modules, added incrementally by Wave 4; see
 *     `src/internal/registry/self-assembly.ts` for the required export
 *     convention). This directory does not exist yet as of this task — zero
 *     domains is a valid, non-error state, and the registry overlay below is
 *     a no-op until Wave 4 adds the first domain module.
 *
 * Both corpora are evidence-only: this tool never embeds capture text or
 * PDF prose into the generated output, only structural facts (title/command,
 * a line/row citation, and a classification derived from a hand-maintained
 * lookup table in `tools/manifest/` — never inferred from the command string itself).
 *
 * Domain-module discovery/assembly is deliberately kept in its own module
 * (`src/internal/registry/self-assembly.ts`, imported below) rather than
 * inlined here, per the existing SRP note against entangling
 * manifest-corpus-reading with domain-discovery — this file only orchestrates
 * both concerns and writes their outputs.
 *
 * Module layout (`tools/manifest/`): `paths` (locations), `cli-corpus` (PDF
 * heading parsing), `classification-data` + `split-families` (hand-maintained
 * tables), `classify` (entry construction), `webui-corpus`, `recon`
 * (live-firmware-recon rows), `render` (module sources), `artifacts`
 * (write/check IO). This file only orchestrates them.
 */

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import type { CapabilityEntry } from "../src/manifest/types.js";
// Runtime (non-type-only) import of a local module: `node
// --experimental-strip-types` only strips types for `.ts` specifiers, so the
// self-assembly module is loaded from the narrow `tsconfig.generator.json`
// build output in `dist/`.
import type * as SelfAssemblyModule from "../src/internal/registry/self-assembly.js";
import { buildInputSchemas, renderInputSchemasModule } from "./manifest/input-schemas.ts";
import { assertNoDuplicateIds, writeOrCheckArtifact } from "./manifest/artifacts.ts";
import { parseCliCorpus } from "./manifest/classify.ts";
import {
  CLI_RAW_PATH,
  DIST_DOMAINS_DIR,
  DOMAINS_DIR,
  GENERATED_OUTPUT_PATH,
  INPUT_SCHEMAS_OUTPUT_PATH,
  OPERATIONS_OUTPUT_PATH,
  REGISTRY_OUTPUT_PATH,
  WEBUI_INDEX_PATH,
  sdkRoot,
} from "./manifest/paths.ts";
import { buildLiveFirmwareReconEntries } from "./manifest/recon.ts";
import {
  formatGeneratedModule,
  renderGeneratedModule,
  renderOperationsModule,
} from "./manifest/render.ts";
import { parseWebUiCorpus } from "./manifest/webui-corpus.ts";

export function buildManifest(): readonly CapabilityEntry[] {
  const cliRawText = readFileSync(CLI_RAW_PATH, "utf-8");
  const webUiIndexText = readFileSync(WEBUI_INDEX_PATH, "utf-8");

  const cliEntries = parseCliCorpus(cliRawText);
  const reconEntries = buildLiveFirmwareReconEntries();
  const webUiEntries = parseWebUiCorpus(webUiIndexText);

  return [...cliEntries, ...reconEntries, ...webUiEntries];
}

/**
 * How `main` loads domain self-assembly. The CLI uses the narrow
 * `tsconfig.generator.json` build in `dist/` (plain Node cannot import
 * `src/**.ts` through `.js` specifiers); unit tests inject the source module
 * and import domains straight from `src/domains/` so they never depend on a
 * stale build.
 */
export interface MainDependencies {
  readonly loadSelfAssembly: () => Promise<typeof SelfAssemblyModule>;
  /** Directory the domain modules are imported from; `undefined` imports `DOMAINS_DIR` sources. */
  readonly domainsImportDir: string | undefined;
}

const builtDependencies: MainDependencies = {
  loadSelfAssembly: async () =>
    (await import(
      new URL("../dist/internal/registry/self-assembly.js", import.meta.url).href
    )) as typeof SelfAssemblyModule,
  domainsImportDir: DIST_DOMAINS_DIR,
};

/**
 * Generates (or, with `--check`, drift-checks) every artifact. Returns `true`
 * when all artifacts are in sync; the CLI entrypoint below maps `false` to a
 * non-zero exit code.
 */
export async function main(
  argv: readonly string[] = process.argv,
  dependencies: MainDependencies = builtDependencies,
): Promise<boolean> {
  const checkMode = argv.includes("--check");
  const corpusManifest = buildManifest();

  assertNoDuplicateIds(corpusManifest);

  const {
    buildSelfAssembledRegistry,
    discoverDomainOperations,
    listDomainModuleFiles,
    overlayImplementedStatus,
    renderRegistryModule,
  } = await dependencies.loadSelfAssembly();

  // Domain self-assembly (BACKLOG.md B1 refinement; ARCHITECTURE.md Item 5):
  // discover `src/domains/*.ts` modules (none exist yet -> empty registry,
  // manifest overlay is a no-op today), assemble a registry from their
  // `operations` exports, and overlay `status: "implemented"` back onto the
  // corpus-derived manifest. See `src/internal/registry/self-assembly.ts` for
  // the domain export convention and validation rules.
  const domainOperations = await discoverDomainOperations(
    DOMAINS_DIR,
    dependencies.domainsImportDir,
  );
  const registry = buildSelfAssembledRegistry(domainOperations, corpusManifest);
  const manifest = overlayImplementedStatus(corpusManifest, registry);
  const domainFileNames = await listDomainModuleFiles(DOMAINS_DIR);

  const cliCount = manifest.filter((entry) => entry.kind === "cli-command").length;
  const webUiCount = manifest.filter((entry) => entry.kind === "webui-page").length;

  const renderedManifest = await formatGeneratedModule(
    renderGeneratedModule(manifest),
    GENERATED_OUTPUT_PATH,
  );
  const renderedRegistry = await formatGeneratedModule(
    renderRegistryModule(domainFileNames),
    REGISTRY_OUTPUT_PATH,
  );
  const renderedOperations = await formatGeneratedModule(
    renderOperationsModule(domainFileNames),
    OPERATIONS_OUTPUT_PATH,
  );

  // Input JSON Schemas (`ARCHITECTURE.md` cross-cutting layout; MCP-facing
  // `./schemas` contract): one entry per implemented operation, keyed by the
  // same `manifestId` the self-assembled `registry` above uses — asserted
  // 1:1 here so `manifest:check` catches either side drifting alone (a new
  // domain operation without a resolvable `TInput`, or a stray schema key).
  const inputSchemas = buildInputSchemas(sdkRoot, domainFileNames, domainOperations);
  const schemaKeys = new Set(Object.keys(inputSchemas));
  const registryKeys = new Set(registry.keys());
  const missingSchemaKeys = [...registryKeys].filter((id) => !schemaKeys.has(id));
  const extraSchemaKeys = [...schemaKeys].filter((id) => !registryKeys.has(id));

  if (missingSchemaKeys.length > 0 || extraSchemaKeys.length > 0) {
    throw new Error(
      "Input schema / operation registry manifestId mismatch. " +
        `Missing schema entries: [${missingSchemaKeys.join(", ")}]. ` +
        `Schema entries with no registry operation: [${extraSchemaKeys.join(", ")}].`,
    );
  }

  const renderedInputSchemas = await formatGeneratedModule(
    renderInputSchemasModule(inputSchemas),
    INPUT_SCHEMAS_OUTPUT_PATH,
  );

  const manifestOk = writeOrCheckArtifact(
    {
      label:
        `${String(manifest.length)} capability manifest entries ` +
        `(${String(cliCount)} cli-command, ${String(webUiCount)} webui-page)`,
      outputPath: GENERATED_OUTPUT_PATH,
      rendered: renderedManifest,
    },
    checkMode,
  );
  const registryOk = writeOrCheckArtifact(
    {
      label:
        `self-assembled operation registry (${String(registry.size)} operations from ` +
        `${String(domainFileNames.length)} domain module(s))`,
      outputPath: REGISTRY_OUTPUT_PATH,
      rendered: renderedRegistry,
    },
    checkMode,
  );
  const operationsOk = writeOrCheckArtifact(
    {
      label: `public operations namespace (${String(domainFileNames.length)} domain family namespace(s))`,
      outputPath: OPERATIONS_OUTPUT_PATH,
      rendered: renderedOperations,
    },
    checkMode,
  );
  const nullSchemaCount = Object.values(inputSchemas).filter((schema) => schema === null).length;
  const inputSchemasOk = writeOrCheckArtifact(
    {
      label:
        `${String(schemaKeys.size)} input schema entries ` +
        `(${String(schemaKeys.size - nullSchemaCount)} with input, ${String(nullSchemaCount)} void)`,
      outputPath: INPUT_SCHEMAS_OUTPUT_PATH,
      rendered: renderedInputSchemas,
    },
    checkMode,
  );

  return manifestOk && registryOk && operationsOk && inputSchemasOk;
}

// Run only when executed as a script (`node tools/generate-capability-manifest.ts`),
// not when imported by unit tests.
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!(await main())) {
    process.exitCode = 1;
  }
}
