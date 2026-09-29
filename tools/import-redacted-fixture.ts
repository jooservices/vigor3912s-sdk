import { fileURLToPath, pathToFileURL } from "node:url";

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
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
