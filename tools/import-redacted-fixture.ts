import { fileURLToPath } from "node:url";

type FixtureImporterModule = typeof import("../src/internal/fixture-importer.js");

const sdkRoot = fileURLToPath(new URL("..", import.meta.url));

async function main(): Promise<void> {
  const importerUrl = new URL("../dist/internal/fixture-importer.js", import.meta.url).href;
  const { importRedactedFixture, parseFixtureImportArgs } = (await import(
    importerUrl
  )) as FixtureImporterModule;

  await importRedactedFixture(parseFixtureImportArgs(process.argv.slice(2)), sdkRoot);
}

await main();
