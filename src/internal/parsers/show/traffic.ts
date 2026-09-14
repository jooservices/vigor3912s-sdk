/**
 * Pure parser for the bare, no-argument `show traffic` command
 * (`cli.show.traffic`, cited at `cli-reference-raw.txt` line 6905: "This
 * command can display traffic graph for WAN#, transmitted bytes, received
 * bytes and sessions."). The documented syntax
 * (`show traffic <wan#><tx/rx> <weekly>` etc.) requires arguments this
 * family's manifest entry does not carry (`command: "show traffic"`, no
 * args) -- no full sample output exists for the bare form in either the
 * vendor manual or `command-map.md`. The DTO is therefore deliberately thin
 * (raw non-empty lines only): inventing a structured shape for an
 * undocumented output would not be honest.
 */

export interface ShowTrafficResult {
  readonly lines: readonly string[];
}

/** Parses bare `show traffic` output into a minimal, honest DTO. Never throws. */
export function parseShowTraffic(text: string): ShowTrafficResult {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith(">"));

  return { lines };
}
