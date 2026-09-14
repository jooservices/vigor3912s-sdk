/**
 * Pure parser for `show pmtime` (`cli.show.pmtime`, cited at
 * `cli-reference-raw.txt` line 6829: "This command displays the reuse time
 * of NAT session.", example output is three "Level<n> TCP=.. UDP=.. ICMP=.."
 * lines).
 */

export interface ShowPmtimeLevel {
  readonly tcp: number;
  readonly udp: number;
  readonly icmp: number;
}

export interface ShowPmtimeResult {
  readonly level0: ShowPmtimeLevel | null;
  readonly level1: ShowPmtimeLevel | null;
  readonly level2: ShowPmtimeLevel | null;
}

const LEVEL_LINE_PATTERN = /Level(\d)\s+TCP=(\d+)\s+UDP=(\d+)\s+ICMP=(\d+)/;

/** Parses `show pmtime` output into a minimal, honest DTO. Never throws. */
export function parseShowPmtime(text: string): ShowPmtimeResult {
  const levels: Record<string, ShowPmtimeLevel> = {};

  for (const line of text.split("\n")) {
    const match = LEVEL_LINE_PATTERN.exec(line);

    if (match === null) {
      continue;
    }

    const [, level, tcp, udp, icmp] = match;

    levels[`level${level ?? ""}`] = {
      tcp: Number(tcp ?? 0),
      udp: Number(udp ?? 0),
      icmp: Number(icmp ?? 0),
    };
  }

  return {
    level0: levels.level0 ?? null,
    level1: levels.level1 ?? null,
    level2: levels.level2 ?? null,
  };
}
