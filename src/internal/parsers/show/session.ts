/**
 * Pure parser for `show session` (`cli.show.session`, cited at
 * `cli-reference-raw.txt` line 6841: "This command displays current status
 * of current session.", example output is a set of "% <label>: <n>" lines
 * plus per-WAN "% WAN<n> Current Session Usage: <n>" lines and two
 * "## Session Create ... Sec: <n>" lines).
 */

export interface ShowSessionWanUsage {
  readonly wan: number;
  readonly usage: number;
}

export interface ShowSessionResult {
  readonly maxSessionNumber: number | null;
  readonly maxSessionUsage: number | null;
  readonly currentSessionUsage: number | null;
  readonly currentSessionUsed: number | null;
  readonly wanUsage: readonly ShowSessionWanUsage[];
  readonly sessionCreateThisSec: number | null;
  readonly sessionCreatePeakSec: number | null;
}

function firstNumber(text: string, pattern: RegExp): number | null {
  const match = pattern.exec(text);
  const value = match?.[1];
  return value === undefined ? null : Number(value);
}

const WAN_USAGE_PATTERN = /WAN(\d+)\s+Current Session Usage:\s*(\d+)/g;

/** Parses `show session` output into a minimal, honest DTO. Never throws. */
export function parseShowSession(text: string): ShowSessionResult {
  const wanUsage: ShowSessionWanUsage[] = [];

  for (const match of text.matchAll(WAN_USAGE_PATTERN)) {
    const [, wan, usage] = match;
    wanUsage.push({ wan: Number(wan ?? 0), usage: Number(usage ?? 0) });
  }

  return {
    maxSessionNumber: firstNumber(text, /Maximum Session Number:\s*(\d+)/),
    maxSessionUsage: firstNumber(text, /Maximum Session Usage:\s*(\d+)/),
    currentSessionUsage: firstNumber(text, /Current Session Usage:\s*(\d+)/),
    currentSessionUsed: firstNumber(
      text,
      /Current Session Used\(include waiting for free\):\s*(\d+)/,
    ),
    wanUsage,
    sessionCreateThisSec: firstNumber(text, /Session Create this Sec:\s*(\d+)/),
    sessionCreatePeakSec: firstNumber(text, /Session Create Peak Sec:\s*(\d+)/),
  };
}
