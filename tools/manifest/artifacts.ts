/** Generated-artifact IO: duplicate guard, write (generate) or diff (check). */

import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { CapabilityEntry } from "../../src/manifest/types.js";

import { sdkRoot } from "./paths.ts";

export function assertNoDuplicateIds(manifest: readonly CapabilityEntry[]): void {
  const seen = new Set<string>();

  for (const entry of manifest) {
    if (seen.has(entry.id)) {
      throw new Error(`Duplicate manifest id generated: "${entry.id}"`);
    }

    seen.add(entry.id);
  }
}

/**
 * Reads a committed generated file, returning `null` if it does not exist
 * yet (distinct from an empty file).
 */
export function readCommitted(outputPath: string): string | null {
  try {
    return readFileSync(outputPath, "utf-8");
  } catch {
    return null;
  }
}

export interface GeneratedArtifact {
  readonly label: string;
  readonly outputPath: string;
  readonly rendered: string;
}

/**
 * Writes (generate mode) or diffs against the committed file (check mode) for
 * a single generated artifact. Returns `true` when the artifact is in sync
 * (either freshly written, or matched the committed file in check mode).
 */
export function writeOrCheckArtifact(artifact: GeneratedArtifact, checkMode: boolean): boolean {
  const { label, outputPath, rendered } = artifact;

  if (!checkMode) {
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, rendered, "utf-8");
    console.log(`Generated ${label} -> ${path.relative(sdkRoot, outputPath)}`);
    return true;
  }

  const committed = readCommitted(outputPath);

  if (committed === rendered) {
    console.log(`manifest:check OK — ${label} matches the committed file.`);
    return true;
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "vigor3912s-manifest-check-"));
  const tempPath = path.join(tempDir, path.basename(outputPath));
  writeFileSync(tempPath, rendered, "utf-8");

  console.error(
    committed === null
      ? `manifest:check FAILED — ${path.relative(sdkRoot, outputPath)} does not exist. ` +
          `Freshly generated output written to ${tempPath} for inspection. Run "npm run manifest:generate".`
      : `manifest:check FAILED — ${path.relative(sdkRoot, outputPath)} is stale/drifted. ` +
          `Freshly generated output written to ${tempPath} for inspection/diff. Run "npm run manifest:generate".`,
  );

  return false;
}
