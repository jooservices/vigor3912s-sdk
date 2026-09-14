/**
 * Pure parser for `show statistic` (`cli.show.statistic`, cited at
 * `cli-reference-raw.txt` line 6947: "This command displays statistics for
 * WAN interface.", example output is a "WAN<n> total TX: <value> ,RX:
 * <value>" line per WAN interface). Byte-unit strings (`"0 Bytes"`,
 * `"2 MB"`) are kept verbatim rather than normalized to a numeric byte
 * count -- the documented example mixes units per row and no conversion
 * rule is documented, so inventing one would not be honest.
 */

export interface ShowStatisticEntry {
  readonly wan: number;
  readonly tx: string;
  readonly rx: string;
}

export interface ShowStatisticResult {
  readonly entries: readonly ShowStatisticEntry[];
}

const ROW_PATTERN = /WAN(\d+)\s+total\s+TX:\s*([^,]+?)\s*,\s*RX:\s*(.+?)\s*$/;

/** Parses `show statistic` output into a minimal, honest DTO. Never throws. */
export function parseShowStatistic(text: string): ShowStatisticResult {
  const entries: ShowStatisticEntry[] = [];

  for (const line of text.split("\n")) {
    const match = ROW_PATTERN.exec(line);

    if (match === null) {
      continue;
    }

    const [, wan, tx, rx] = match;

    entries.push({
      wan: Number(wan ?? 0),
      tx: tx ?? "",
      rx: rx ?? "",
    });
  }

  return { entries };
}
