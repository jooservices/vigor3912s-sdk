/**
 * Pure parser for `show openport` (`cli.show.openport`, cited at
 * `cli-reference-raw.txt` line 6787: "This command displays current status
 * of open port setting.", example output is an
 * Index/Status/Comment/Local IP Address table plus a "Total N items
 * listed." trailer line).
 */

export interface ShowOpenportEntry {
  readonly index: number;
  readonly status: string;
  readonly comment: string;
  readonly localIp: string;
}

export interface ShowOpenportResult {
  readonly entries: readonly ShowOpenportEntry[];
  readonly totalItems: number | null;
}

const ROW_PATTERN = /^\s*(\d+)\.\s+(\S+)\s+(\S+)\s+(\S+)\s*$/;
const TOTAL_PATTERN = /Total\s+(\d+)\s+items? listed\./;

/** Parses `show openport` output into a minimal, honest DTO. Never throws. */
export function parseShowOpenport(text: string): ShowOpenportResult {
  const entries: ShowOpenportEntry[] = [];
  let totalItems: number | null = null;

  for (const line of text.split("\n")) {
    const rowMatch = ROW_PATTERN.exec(line);

    if (rowMatch !== null) {
      const [, index, status, comment, localIp] = rowMatch;
      entries.push({
        index: Number(index ?? 0),
        status: status ?? "",
        comment: comment ?? "",
        localIp: localIp ?? "",
      });
      continue;
    }

    const totalMatch = TOTAL_PATTERN.exec(line);
    if (totalMatch !== null) {
      totalItems = Number(totalMatch[1] ?? 0);
    }
  }

  return { entries, totalItems };
}
