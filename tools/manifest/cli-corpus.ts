/** Part VIII CLI corpus parsing helpers (pure). */

/**
 * `cli-reference-raw.txt` was extracted from a PDF whose "bold" headings were
 * rendered by doubling every character (including spaces): the printed
 * heading "Telnet Command: wan vlan" appears in the raw text as
 * "TTeellnneett  CCoommmmaanndd::  wwaann  vvllaann" — each character, including
 * spaces, is duplicated in place. Decoding is therefore just "keep every
 * even-indexed character".
 */
export function decodeDoubledLetters(doubled: string): string {
  let decoded = "";

  for (let i = 0; i < doubled.length; i += 2) {
    decoded += doubled.charAt(i);
  }

  return decoded;
}

const HEADING_MARKER_DOUBLED = "TTeellnneett  CCoommmmaanndd::";

/**
 * Indentation trap (`ARCHITECTURE.md`, `BACKLOG.md` A2): 326 of the 327
 * headings start at column 0; the "wan vlan" heading (raw line 11191) is
 * indented by two spaces. A naive `^`-anchored regex against the doubled
 * marker undercounts to 326. This scans for the marker as a substring
 * anywhere on the line (via `String.includes`), so both indented and
 * column-0 headings are found identically — verified against the raw file:
 * exactly 327 lines contain the marker; exactly 1 of those 327 is indented.
 */
export function findCliHeadingLines(rawLines: readonly string[]): readonly number[] {
  const headingLineNumbers: number[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i]?.includes(HEADING_MARKER_DOUBLED) === true) {
      headingLineNumbers.push(i + 1); // 1-based raw line number, matches the file on disk.
    }
  }

  return headingLineNumbers;
}

/** Finds the PDF page number in effect at a given raw-text line (`===PAGE N===` markers). */
export function buildPageIndex(rawLines: readonly string[]): readonly (number | null)[] {
  const pageAtLine: (number | null)[] = [];
  let currentPage: number | null = null;

  for (const line of rawLines) {
    const match = /^===PAGE (\d+)===$/.exec(line.trim());

    if (match?.[1] !== undefined) {
      currentPage = Number(match[1]);
    }

    pageAtLine.push(currentPage);
  }

  return pageAtLine;
}

/**
 * Extracts the command title from a decoded heading line, e.g.
 * `"Telnet Command: wan vlan"` -> `"wan vlan"`.
 */
export function extractCommandTitle(decodedLine: string): string {
  const marker = "Command:";
  const index = decodedLine.indexOf(marker);

  if (index === -1) {
    throw new Error(`Decoded CLI heading line missing "${marker}" marker: "${decodedLine}"`);
  }

  return decodedLine.slice(index + marker.length).trim();
}

/**
 * Many headings bundle multiple sibling variants behind a single documented
 * heading, e.g. `"swm enable / disable"`, `"wan mtu / mtu2"`,
 * `"apm enable/disable/show/clear/discover/query"`. The "family key" used
 * for classification lookups is the first variant, normalized to lowercase.
 */
export function familyKey(title: string): string {
  const firstVariant = title.split("/")[0] ?? title;
  return firstVariant.trim().toLowerCase();
}

/** `commandPath`: the heading's words, dropping bare `/` separators from bundled headings. */
export function commandPathFromTitle(title: string): readonly string[] {
  return title
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && token !== "/");
}

export function slugifyCommandPath(commandPath: readonly string[]): string {
  return commandPath
    .map((token) => token.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter((token) => token.length > 0)
    .join(".");
}
