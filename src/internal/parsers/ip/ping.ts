/**
 * Parser for `ip ping` (`cli.ip.ping`, rawLine 1205).
 *
 * Documented example shape:
 * ```
 * Pinging 172.16.3.229 with 64 bytes of Data:
 * Receive reply from 172.16.3.229, time=0ms
 * Receive reply from 172.16.3.229, time=0ms
 * Receive reply from 172.16.3.229, time=0ms
 * Packets: Sent = 5, Received = 5, Lost = 0 <0% loss>
 * ```
 * Pure, no I/O -- `ARCHITECTURE.md` Item 5's `(text: string) => TOutput`
 * parser signature.
 */

export interface IpPingReply {
  readonly timeMs: number;
}

export interface IpPingReport {
  readonly target: string | null;
  readonly replies: readonly IpPingReply[];
  readonly packetsSent: number | null;
  readonly packetsReceived: number | null;
  readonly packetsLost: number | null;
  readonly lossPercent: number | null;
}

const PINGING_PATTERN = /^Pinging\s+(\S+)\s+with/;
const REPLY_PATTERN = /^Receive reply from\s+\S+,\s*time=(\d+)ms/;
const SUMMARY_PATTERN =
  /^Packets:\s*Sent\s*=\s*(\d+),\s*Received\s*=\s*(\d+),\s*Lost\s*=\s*(\d+)\s*<\s*(\d+)%\s*loss>/;

export function parsePing(text: string): IpPingReport {
  let target: string | null = null;
  const replies: IpPingReply[] = [];
  let packetsSent: number | null = null;
  let packetsReceived: number | null = null;
  let packetsLost: number | null = null;
  let lossPercent: number | null = null;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    const pingingMatch = PINGING_PATTERN.exec(trimmed);
    if (pingingMatch?.[1] !== undefined) {
      target = pingingMatch[1];
      continue;
    }

    const replyMatch = REPLY_PATTERN.exec(trimmed);
    if (replyMatch?.[1] !== undefined) {
      replies.push({ timeMs: Number.parseInt(replyMatch[1], 10) });
      continue;
    }

    const summaryMatch = SUMMARY_PATTERN.exec(trimmed);
    if (
      summaryMatch?.[1] !== undefined &&
      summaryMatch[2] !== undefined &&
      summaryMatch[3] !== undefined &&
      summaryMatch[4] !== undefined
    ) {
      packetsSent = Number.parseInt(summaryMatch[1], 10);
      packetsReceived = Number.parseInt(summaryMatch[2], 10);
      packetsLost = Number.parseInt(summaryMatch[3], 10);
      lossPercent = Number.parseInt(summaryMatch[4], 10);
    }
  }

  return { target, replies, packetsSent, packetsReceived, packetsLost, lossPercent };
}
