/**
 * Feature census gate (run by `npm test` after the full Vitest suite): every
 * registered operation must have had both `buildFrames` and `parse`
 * executed by at least one unit test. Usage records are written per test
 * file by `tests/support/operation-usage.ts` into `.op-usage/`.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { CLI_RAW_PATH, sdkRoot } from "./manifest/paths.ts";
import { SYNTAX_FORM_EXCLUSIONS } from "./manifest/syntax-form-exclusions.ts";
import {
  extractSyntaxForms,
  formMatchesCommand,
  type SyntaxForm,
} from "./manifest/syntax-forms.ts";

export interface OperationUsageRecord {
  readonly buildFrames: readonly string[];
  readonly parse: readonly string[];
  /** Commands built by operations during the test file (optional in older records). */
  readonly commands?: readonly string[];
}

export interface SyntaxCensus {
  /** Documented forms no tested command instantiates and that are not excluded. */
  readonly uncovered: readonly SyntaxForm[];
  /** Excluded forms that are now covered (the exclusion must be removed). */
  readonly staleExclusions: readonly string[];
  readonly total: number;
}

/**
 * Sub-form census: every documented Part VIII syntax form must be
 * instantiated by at least one command an operation built in a unit test,
 * unless it is listed in `SYNTAX_FORM_EXCLUSIONS` with a reason.
 */
export function checkSyntaxForms(
  forms: readonly SyntaxForm[],
  records: readonly OperationUsageRecord[],
  exclusions: Readonly<Record<string, string>> = SYNTAX_FORM_EXCLUSIONS,
): SyntaxCensus {
  const commands = [...new Set(records.flatMap((record) => record.commands ?? []))];
  const isCovered = (form: SyntaxForm): boolean =>
    commands.some((command) => formMatchesCommand(form.form, command));
  const covered = new Set(forms.filter(isCovered).map((form) => form.form));

  return {
    uncovered: forms.filter(
      (form) => !covered.has(form.form) && !Object.hasOwn(exclusions, form.form),
    ),
    staleExclusions: Object.keys(exclusions).filter((form) => covered.has(form)),
    total: forms.length,
  };
}

export function formatSyntaxReport(census: SyntaxCensus, excluded: number): string {
  if (census.uncovered.length === 0 && census.staleExclusions.length === 0) {
    return `syntax-form census OK — ${String(census.total - excluded)} of ${String(census.total)} documented forms covered by tests, ${String(excluded)} excluded with a reason.`;
  }

  return [
    `syntax-form census FAILED — ${String(census.uncovered.length)} uncovered form(s), ${String(census.staleExclusions.length)} stale exclusion(s):`,
    ...census.uncovered.map(
      (form) => `  - uncovered (rawLine ${String(form.rawLine)}): ${form.form}`,
    ),
    ...census.staleExclusions.map((form) => `  - now covered, remove exclusion: ${form}`),
  ].join("\n");
}

export interface UntestedOperation {
  readonly manifestId: string;
  readonly missing: readonly ("buildFrames" | "parse")[];
}

export function findUntestedOperations(
  manifestIds: readonly string[],
  records: readonly OperationUsageRecord[],
): readonly UntestedOperation[] {
  const built = new Set(records.flatMap((record) => record.buildFrames));
  const parsed = new Set(records.flatMap((record) => record.parse));

  return manifestIds.flatMap((manifestId) => {
    const missing = [
      ...(built.has(manifestId) ? [] : (["buildFrames"] as const)),
      ...(parsed.has(manifestId) ? [] : (["parse"] as const)),
    ];

    return missing.length === 0 ? [] : [{ manifestId, missing }];
  });
}

export function readUsageRecords(directory: string): readonly OperationUsageRecord[] {
  let fileNames: readonly string[];

  try {
    fileNames = readdirSync(directory).filter((fileName) => fileName.endsWith(".json"));
  } catch {
    throw new Error(`No operation usage records in ${directory}; run the full test suite first.`);
  }

  return fileNames.map(
    (fileName) =>
      JSON.parse(readFileSync(path.join(directory, fileName), "utf-8")) as OperationUsageRecord,
  );
}

export function formatReport(untested: readonly UntestedOperation[], total: number): string {
  if (untested.length === 0) {
    return `operation census OK — all ${String(total)} operations have buildFrames + parse executed by tests.`;
  }

  return (
    `operation census FAILED — ${String(untested.length)} of ${String(total)} operation(s) lack test execution:\n` +
    untested.map((entry) => `  - ${entry.manifestId}: ${entry.missing.join(", ")}`).join("\n")
  );
}

export async function main(
  usageDirectory = path.join(sdkRoot, ".op-usage"),
  loadForms: () => readonly SyntaxForm[] = () =>
    extractSyntaxForms(readFileSync(CLI_RAW_PATH, "utf-8")),
  loadManifestIds: () => Promise<readonly string[]> = async () => {
    const { operationRegistry } = (await import(
      pathToFileURL(path.join(sdkRoot, "dist/internal/registry/registry.generated.js")).href
    )) as { operationRegistry: ReadonlyMap<string, unknown> };

    return [...operationRegistry.keys()];
  },
): Promise<boolean> {
  const manifestIds = await loadManifestIds();
  const records = readUsageRecords(usageDirectory);
  const untested = findUntestedOperations(manifestIds, records);
  const report = formatReport(untested, manifestIds.length);
  const syntax = checkSyntaxForms(loadForms(), records);
  const syntaxReport = formatSyntaxReport(syntax, Object.keys(SYNTAX_FORM_EXCLUSIONS).length);
  const syntaxOk = syntax.uncovered.length === 0 && syntax.staleExclusions.length === 0;

  (untested.length === 0 ? console.log : console.error)(report);
  (syntaxOk ? console.log : console.error)(syntaxReport);

  return untested.length === 0 && syntaxOk;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!(await main())) {
    process.exitCode = 1;
  }
}
