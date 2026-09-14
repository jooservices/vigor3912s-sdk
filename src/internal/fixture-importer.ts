import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { redactFixture, redactionRuleVersion } from "./fixture-redaction.js";

export interface FixtureImportOptions {
  readonly input: string;
  readonly output: string;
  readonly provenance: string;
}

export interface FixtureImportProvenance {
  readonly sourceKind: "external-input";
  readonly sourceSha256: string;
  readonly outputSha256: string;
  readonly redactionCounts: {
    readonly domain: number;
    readonly ipv4: number;
    readonly ipv6: number;
    readonly labeledValue: number;
    readonly mac: number;
  };
  readonly redactionRuleVersion: typeof redactionRuleVersion;
}

export async function importRedactedFixture(
  options: FixtureImportOptions,
  sdkRoot: string = process.cwd(),
): Promise<FixtureImportProvenance> {
  const resolvedSdkRoot = resolve(sdkRoot);
  const fixturesRoot = resolve(resolvedSdkRoot, "tests", "fixtures");
  const inputPath = resolve(resolvedSdkRoot, options.input);
  const outputPath = resolve(resolvedSdkRoot, options.output);
  const provenancePath = resolve(resolvedSdkRoot, options.provenance);

  assertPathOutside(inputPath, fixturesRoot, "--input");
  assertPathInside(outputPath, fixturesRoot, "--output");
  assertPathInside(provenancePath, fixturesRoot, "--provenance");
  assertDistinctPaths(inputPath, outputPath, "--input", "--output");
  assertDistinctPaths(inputPath, provenancePath, "--input", "--provenance");
  assertDistinctPaths(outputPath, provenancePath, "--output", "--provenance");

  const source = await readSource(inputPath);
  const redacted = redactFixture(source);
  const provenance = {
    sourceKind: "external-input",
    sourceSha256: redacted.inputSha256,
    outputSha256: redacted.outputSha256,
    redactionCounts: redacted.redactionCounts,
    redactionRuleVersion,
  } satisfies FixtureImportProvenance;

  await mkdir(dirname(outputPath), { recursive: true });
  await mkdir(dirname(provenancePath), { recursive: true });
  await writeFile(outputPath, redacted.content, "utf8");
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`, "utf8");

  return provenance;
}

async function readSource(inputPath: string): Promise<string> {
  try {
    return await readFile(inputPath, "utf8");
  } catch {
    throw new Error("Unable to read external input source");
  }
}

export function parseFixtureImportArgs(args: readonly string[]): FixtureImportOptions {
  const values = new Map<string, string>();

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];

    if (flag === undefined || value === undefined || !flag.startsWith("--")) {
      throw new Error(
        "Usage: npm run fixtures:import -- --input <path> --output <path> --provenance <path>",
      );
    }

    values.set(flag, value);
  }

  const input = values.get("--input");
  const output = values.get("--output");
  const provenance = values.get("--provenance");

  if (input === undefined || output === undefined || provenance === undefined) {
    throw new Error("--input, --output, and --provenance are required");
  }

  return { input, output, provenance };
}

function assertPathInside(path: string, root: string, label: string): void {
  const relation = relative(root, path);

  if (relation === "" || relation.startsWith("..") || isAbsolute(relation)) {
    throw new Error(`${label} must be under tests/fixtures`);
  }
}

function assertPathOutside(path: string, root: string, label: string): void {
  const relation = relative(root, path);

  if (relation === "" || (!relation.startsWith("..") && !isAbsolute(relation))) {
    throw new Error(`${label} must be outside tests/fixtures`);
  }
}

function assertDistinctPaths(
  firstPath: string,
  secondPath: string,
  firstLabel: string,
  secondLabel: string,
): void {
  if (firstPath === secondPath) {
    throw new Error(`${firstLabel} and ${secondLabel} must not overlap`);
  }

  const firstToSecond = relative(firstPath, secondPath);
  const secondToFirst = relative(secondPath, firstPath);

  if (!firstToSecond.startsWith("..") || !secondToFirst.startsWith("..")) {
    throw new Error(`${firstLabel} and ${secondLabel} must not overlap`);
  }
}
