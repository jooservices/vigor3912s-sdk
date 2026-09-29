/** Source renderers for the generated manifest / operations modules. */

import * as prettier from "prettier";

import type { CapabilityEntry } from "../../src/manifest/types.js";

export function renderGeneratedModule(manifest: readonly CapabilityEntry[]): string {
  const body = JSON.stringify(manifest, null, 2);

  return `/**
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by \`tools/generate-capability-manifest.ts\` from:
 *   - \`references/cli-reference-raw.txt\` (327 CLI headings)
 *   - live-firmware-recon additive CLI rows (fw 4.4.7_RC2; not in PDF)
 *   - \`references/webui-index.md\` (171 WebUI capture rows)
 *
 * Regenerate with \`npm run manifest:generate\`; drift is caught by
 * \`npm run manifest:check\` (folded into \`npm run verify\`).
 */

import type { CapabilityEntry } from "./types.js";

export const capabilityManifest = ${body} as const satisfies readonly CapabilityEntry[];
`;
}

export function domainFamilyIdentifier(fileName: string): string {
  const family = fileName.replace(/\.ts$/, "");

  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(family)) {
    throw new Error(
      `Domain file basename "${family}" is not a valid TypeScript identifier for the public operations namespace.`,
    );
  }

  return family;
}

export function domainNamespaceImportIdentifier(fileName: string): string {
  const family = domainFamilyIdentifier(fileName);
  const reservedIdentifiers = new Set(["switch"]);

  return reservedIdentifiers.has(family) ? `${family}Domain` : family;
}

export function renderOperationsModule(domainFileNames: readonly string[]): string {
  const imports = domainFileNames
    .map((fileName) => {
      const family = domainFamilyIdentifier(fileName);
      const importIdentifier = domainNamespaceImportIdentifier(fileName);

      return `import * as ${importIdentifier} from "../domains/${family}.js";`;
    })
    .join("\n");

  const entries = domainFileNames
    .map((fileName) => {
      const family = domainFamilyIdentifier(fileName);
      const importIdentifier = domainNamespaceImportIdentifier(fileName);

      return family === importIdentifier ? `  ${family},` : `  ${family}: ${importIdentifier},`;
    })
    .join("\n");

  return `/**
 * GENERATED FILE — do not hand-edit.
 * Produced by tools/generate-capability-manifest.ts.
 */

${imports.length > 0 ? `${imports}\n\n` : ""}export const operations = {
${entries}
} as const;

export type { TypedOperation, OperationClassification } from "../internal/registry/operation.js";
export type { CommandExchange } from "../internal/execution/transport.js";
export type { CommandFrame } from "../internal/execution/framing.js";
export type { ExecutionLimits } from "../internal/execution/limits.js";
`;
}

/**
 * Formats generated output with the project's own Prettier config so the
 * committed file always matches `npm run format:check` byte-for-byte
 * (`JSON.stringify` quotes every object key; Prettier's default
 * `quoteProps: "as-needed"` does not) and so `manifest:check`'s string
 * comparison is stable across regenerations.
 */
export async function formatGeneratedModule(source: string, outputPath: string): Promise<string> {
  const config = await prettier.resolveConfig(outputPath);

  return prettier.format(source, {
    ...config,
    filepath: outputPath,
  });
}
