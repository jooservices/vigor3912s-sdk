/**
 * Pure parser for the parameterized `show clienttraffic` command
 * (`cli.show.clienttraffic`, cited at `cli-reference-raw.txt` line 6928).
 * The manual gives no example output, so the DTO stays thin (raw non-empty
 * lines only).
 */

export interface ShowClientTrafficResult {
  readonly lines: readonly string[];
}

/** Parses `show clienttraffic` output into a minimal, honest DTO. Never throws. */
export function parseShowClientTraffic(text: string): ShowClientTrafficResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith(">"));

  return { lines };
}
