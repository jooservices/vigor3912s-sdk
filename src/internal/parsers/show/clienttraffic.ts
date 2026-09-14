/**
 * Pure parser for the bare, no-argument `show clienttraffic` command
 * (`cli.show.clienttraffic`, cited at `cli-reference-raw.txt` line 6928:
 * "This command displays packet information for specified external
 * device."). The manual documents only the parameterized syntax
 * (`show clienttraffic <device index><wan#/lan#><tx/rx> <weekly>`, all
 * arguments required) and gives no example output at all; this family's
 * manifest entry carries the bare `command: "show clienttraffic"` (no
 * args). With zero documented output shape to justify structured fields,
 * the DTO stays as thin as `show traffic`'s (raw non-empty lines only).
 */

export interface ShowClientTrafficResult {
  readonly lines: readonly string[];
}

/** Parses bare `show clienttraffic` output into a minimal, honest DTO. Never throws. */
export function parseShowClientTraffic(text: string): ShowClientTrafficResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith(">"));

  return { lines };
}
