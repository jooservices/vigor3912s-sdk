/** CLI heading classification + manifest entry construction. */

import type {
  CliCapabilityEntry,
  Classification,
  ClassificationBasis,
} from "../../src/manifest/types.js";

import {
  DANGER_LIST_FAMILIES,
  DOCUMENTATION_BLOCKED_FAMILIES,
  DOCUMENTATION_SYNTAX_CLASSIFICATION,
  READ_ONLY_FAMILIES,
  SESSION_META_FAMILIES,
  SIBLING_LIVE_VERIFIED_CLASSIFICATION,
  STREAMING_FAMILIES,
  WRITE_FAMILIES,
  WRITE_FAMILY_PREFIXES,
} from "./classification-data.ts";
import {
  buildPageIndex,
  commandPathFromTitle,
  decodeDoubledLetters,
  extractCommandTitle,
  familyKey,
  findCliHeadingLines,
  slugifyCommandPath,
} from "./cli-corpus.ts";
import { SPLIT_FAMILIES } from "./split-families.ts";

export interface ClassificationResult {
  readonly classification: Classification;
  readonly classificationBasis: ClassificationBasis;
  readonly status: "documented" | "blocked-by-documentation";
  readonly blockedReason?: string;
}

export function classifyCliCommand(title: string): ClassificationResult {
  const key = familyKey(title);

  if (DANGER_LIST_FAMILIES.has(key)) {
    return {
      classification: "destructive",
      classificationBasis: "operations-danger-list",
      status: "documented",
    };
  }

  if (STREAMING_FAMILIES.has(key)) {
    return {
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "blocked-by-documentation",
      blockedReason:
        'Documented as a continuous watch/tail-style command (e.g. "log -wt"); it does not ' +
        "fit the bounded single-exchange execution model (ARCHITECTURE.md Item 3) until a " +
        "dedicated streaming design exists.",
    };
  }

  const sessionMetaReason = SESSION_META_FAMILIES.get(key);
  if (sessionMetaReason !== undefined) {
    return {
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "blocked-by-documentation",
      blockedReason: sessionMetaReason,
    };
  }

  const documentationBlockedReason = DOCUMENTATION_BLOCKED_FAMILIES.get(key);
  if (documentationBlockedReason !== undefined) {
    return {
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "blocked-by-documentation",
      blockedReason: documentationBlockedReason,
    };
  }

  if (READ_ONLY_FAMILIES.has(key)) {
    return {
      classification: "read",
      classificationBasis: "command-map-family",
      status: "documented",
    };
  }

  if (WRITE_FAMILIES.has(key)) {
    return {
      classification: "write",
      classificationBasis: "command-map-family",
      status: "documented",
    };
  }

  if (WRITE_FAMILY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix} `))) {
    return {
      classification: "write",
      classificationBasis: "command-map-family",
      status: "documented",
    };
  }

  return { classification: "unknown", classificationBasis: "unclassified", status: "documented" };
}

/**
 * Builds every manifest entry sourced from a single CLI heading. Most
 * headings produce exactly one entry (unchanged behavior); headings present
 * in `SPLIT_FAMILIES` (amendment 2026-09-13, see comment above that table)
 * produce one entry per real documented sub-command, all sharing this
 * heading's citation.
 */
export function buildCliEntriesForHeading(
  title: string,
  citation: CliCapabilityEntry["citation"],
): readonly CliCapabilityEntry[] {
  const key = familyKey(title);
  const split = SPLIT_FAMILIES.get(key);

  if (split !== undefined) {
    return split.map((sub) => {
      const entry: CliCapabilityEntry = {
        kind: "cli-command",
        id: sub.id ?? `cli.${slugifyCommandPath(sub.commandPath)}`,
        title: sub.command,
        citation,
        classification: sub.classification,
        classificationBasis: sub.classificationBasis,
        status: "documented",
        operationIds: [],
        command: sub.command,
        commandPath: sub.commandPath,
        firmwareBasis: "user-guide-v4.3.5.1",
        verifiedOnFirmware: null,
      };

      return entry;
    });
  }

  const commandPath = commandPathFromTitle(title);
  const id = `cli.${slugifyCommandPath(commandPath)}`;
  const baseResult = classifyCliCommand(title);
  const documentationOverride = DOCUMENTATION_SYNTAX_CLASSIFICATION[id];
  const afterDocumentation =
    documentationOverride !== undefined
      ? {
          ...baseResult,
          classification: documentationOverride,
          classificationBasis: "documented-syntax" as const,
        }
      : baseResult;
  const siblingOverride = SIBLING_LIVE_VERIFIED_CLASSIFICATION[id];
  const { classification, classificationBasis, status, blockedReason } =
    siblingOverride !== undefined
      ? {
          ...afterDocumentation,
          classification: siblingOverride,
          classificationBasis: "sibling-live-verified" as const,
        }
      : afterDocumentation;

  const entry: CliCapabilityEntry = {
    kind: "cli-command",
    id,
    title,
    citation,
    classification,
    classificationBasis,
    status,
    ...(blockedReason !== undefined ? { blockedReason } : {}),
    operationIds: [],
    command: title,
    commandPath,
    firmwareBasis: "user-guide-v4.3.5.1",
    verifiedOnFirmware: null,
  };

  return [entry];
}

export function parseCliCorpus(rawText: string): readonly CliCapabilityEntry[] {
  const rawLines = rawText.split("\n");
  const headingLineNumbers = findCliHeadingLines(rawLines);
  const pageAtLine = buildPageIndex(rawLines);

  return headingLineNumbers.flatMap((rawLine) => {
    const rawLineText = rawLines[rawLine - 1] ?? "";
    const decoded = decodeDoubledLetters(rawLineText.trim());
    const title = extractCommandTitle(decoded);
    const pdfPage = pageAtLine[rawLine - 1] ?? 0;
    const citation: CliCapabilityEntry["citation"] = {
      corpus: "user-guide-part-viii",
      rawLine,
      pdfPage,
    };

    return buildCliEntriesForHeading(title, citation);
  });
}
