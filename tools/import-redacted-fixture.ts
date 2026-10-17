import { fileURLToPath } from "node:url";

import { runIfMain } from "./cli-entry.ts";
type FixtureImporterModule = typeof import("../src/internal/fixture-importer.js");

const sdkRoot = fileURLToPath(new URL("..", import.meta.url));

export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  const importerUrl = new URL("../dist/internal/fixture-importer.js", import.meta.url).href;
  const { importRedactedFixture, parseFixtureImportArgs } = (await import(
    importerUrl
  )) as FixtureImporterModule;

  await importRedactedFixture(parseFixtureImportArgs(args), sdkRoot);
}

// Run only when executed as a script, not when imported by unit tests.
await runIfMain(process.argv[1], import.meta.url, main);
