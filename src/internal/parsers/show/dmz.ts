/**
 * Pure parser for `show dmz` (`cli.show.dmz`, cited at
 * `cli-reference-raw.txt` line 6733: "This command displays current status
 * of DMZ host.", example output repeats a "WAN<n> DMZ mapping status:"
 * header followed by an Index/Status/aux IP/Private IP table per WAN).
 */

export interface ShowDmzEntry {
  readonly wan: number;
  readonly index: number;
  readonly status: string;
  readonly auxIp: string;
  readonly privateIp: string | null;
}

export interface ShowDmzResult {
  readonly entries: readonly ShowDmzEntry[];
}

const WAN_HEADER_PATTERN = /WAN(\d+)\s+DMZ mapping status:/g;
const ROW_PATTERN = /^\s*(\d+)\s+(\S+)\s+(\S+)(?:\s+(\S+))?\s*$/;

/** Parses `show dmz` output into a minimal, honest DTO. Never throws. */
export function parseShowDmz(text: string): ShowDmzResult {
  const headerMatches = [...text.matchAll(WAN_HEADER_PATTERN)];
  const entries: ShowDmzEntry[] = [];

  for (const [sectionIndex, header] of headerMatches.entries()) {
    const wan = Number(header[1] ?? 0);
    const sectionStart = header.index + header[0].length;
    const sectionEnd = headerMatches[sectionIndex + 1]?.index ?? text.length;
    const section = text.slice(sectionStart, sectionEnd);

    for (const line of section.split("\n")) {
      const rowMatch = ROW_PATTERN.exec(line);

      if (rowMatch === null) {
        continue;
      }

      const [, index, status, auxIpOrPrivateIp, maybePrivateIp] = rowMatch;

      entries.push({
        wan,
        index: Number(index ?? 0),
        status: status ?? "",
        auxIp: auxIpOrPrivateIp ?? "",
        privateIp: maybePrivateIp ?? null,
      });
    }
  }

  return { entries };
}
