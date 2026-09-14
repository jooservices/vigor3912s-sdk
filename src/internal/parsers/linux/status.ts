/**
 * Pure parser for `linux status` (`cli.linux.status`, cited at
 * `cli-reference-raw.txt` line 12969: "status Display current status of
 * linux application."). Also a `liveReadOnlyAllowlist` id
 * (`src/live/allowlist.ts`) -- kept minimal but a genuine reflection of the
 * documented "current status" description (a running/stopped flag), not an
 * invented richer shape.
 */

export interface LinuxStatusResult {
  readonly raw: string;
  readonly running: boolean;
}

const RUNNING_PATTERN = /\brunning\b/i;
const STOPPED_PATTERN = /\bstopped\b/i;

/**
 * `running` is `true` only when the text mentions "running" without also
 * mentioning "stopped" -- an honest, conservative reading rather than a
 * guess when the text is ambiguous or empty.
 */
export function parseLinuxStatus(text: string): LinuxStatusResult {
  const raw = text.trim();
  const running = RUNNING_PATTERN.test(raw) && !STOPPED_PATTERN.test(raw);

  return { raw, running };
}
