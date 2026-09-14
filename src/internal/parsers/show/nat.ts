/**
 * Pure parser for `show nat` (`cli.show.nat`, cited at
 * `cli-reference-raw.txt` line 6796: "This command displays current status
 * of NAT.", example output is a "Port Redirection Running Table" with
 * Index/Protocol/Public Port/Private IP/Private Port columns).
 */

export interface ShowNatEntry {
  readonly index: number;
  readonly protocol: number;
  readonly publicPort: number;
  readonly privateIp: string;
  readonly privatePort: number;
}

export interface ShowNatResult {
  readonly entries: readonly ShowNatEntry[];
}

const ROW_PATTERN = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\d+)\s*$/;

/**
 * Parses `show nat` output into a minimal, honest DTO. Rows with a private
 * IP of `0.0.0.0` (unused NAT slots, per the documented example) are kept
 * as-is; filtering them is a caller concern, not a parser concern.
 */
export function parseShowNat(text: string): ShowNatResult {
  const entries: ShowNatEntry[] = [];

  for (const line of text.split("\n")) {
    const match = ROW_PATTERN.exec(line);

    if (match === null) {
      continue;
    }

    const [, index, protocol, publicPort, privateIp, privatePort] = match;

    entries.push({
      index: Number(index ?? 0),
      protocol: Number(protocol ?? 0),
      publicPort: Number(publicPort ?? 0),
      privateIp: privateIp ?? "",
      privatePort: Number(privatePort ?? 0),
    });
  }

  return { entries };
}
