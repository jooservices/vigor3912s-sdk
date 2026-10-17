/**
 * Pure parser for parameterized read forms of `show traffic`
 * (`cli.show.traffic`, cited at `cli-reference-raw.txt` line 6905). The
 * generic operation accepts the documented WAN, IP, and session query forms
 * while excluding the state-changing IP-statistics toggle. No full sample
 * output exists for each form, so the DTO stays deliberately thin (raw
 * non-empty lines only).
 */

export interface ShowTrafficResult {
  readonly lines: readonly string[];
}

/** Parses `show traffic` output into a minimal, honest DTO. Never throws. */
export function parseShowTraffic(text: string): ShowTrafficResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith(">"));

  return { lines };
}
