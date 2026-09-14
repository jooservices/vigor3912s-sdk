/**
 * Parser for `ip tracert` (`cli.ip.tracert`, rawLine 1225).
 *
 * Documented example shape:
 * ```
 * Traceroute to 22.128.2.62, 30 hops max
 * 1 172.16.3.7 10ms
 * 2 172.16.1.2 10ms
 * 3 Request Time out.
 * ```
 * Pure, no I/O -- `ARCHITECTURE.md` Item 5's `(text: string) => TOutput`
 * parser signature.
 */

export interface IpTracertHop {
  readonly hop: number;
  readonly address: string | null;
  readonly timeMs: number | null;
  readonly timedOut: boolean;
}

export interface IpTracertReport {
  readonly target: string | null;
  readonly maxHops: number | null;
  readonly hops: readonly IpTracertHop[];
}

const HEADER_PATTERN = /^Traceroute to\s+(\S+?),\s*(\d+)\s*hops max/;
const HOP_PATTERN = /^(\d+)\s+(\S+)\s+(\d+)ms\s*$/;
const TIMEOUT_PATTERN = /^(\d+)\s+Request Time out\.?\s*$/i;

export function parseTracert(text: string): IpTracertReport {
  let target: string | null = null;
  let maxHops: number | null = null;
  const hops: IpTracertHop[] = [];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    const headerMatch = HEADER_PATTERN.exec(trimmed);
    if (headerMatch?.[1] !== undefined && headerMatch[2] !== undefined) {
      target = headerMatch[1].replace(/,$/, "");
      maxHops = Number.parseInt(headerMatch[2], 10);
      continue;
    }

    const timeoutMatch = TIMEOUT_PATTERN.exec(trimmed);
    if (timeoutMatch?.[1] !== undefined) {
      hops.push({
        hop: Number.parseInt(timeoutMatch[1], 10),
        address: null,
        timeMs: null,
        timedOut: true,
      });
      continue;
    }

    const hopMatch = HOP_PATTERN.exec(trimmed);
    if (hopMatch?.[1] !== undefined && hopMatch[2] !== undefined && hopMatch[3] !== undefined) {
      hops.push({
        hop: Number.parseInt(hopMatch[1], 10),
        address: hopMatch[2],
        timeMs: Number.parseInt(hopMatch[3], 10),
        timedOut: false,
      });
    }
  }

  return { target, maxHops, hops };
}
