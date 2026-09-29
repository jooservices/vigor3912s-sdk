/**
 * Shared minimal parsing helpers for the `linux` domain (`Item5-linux`).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). No example output blocks exist for this
 * family in `.ai/skills/vigor3912s/references/command-map.md` or the raw
 * user-guide text at `cli-reference-raw.txt` line 12969 -- every documented
 * `linux` command is described only by its syntax/effect, never a sample
 * response. Mirrors the same precedent already established by the sibling
 * `sys`/`wan` families (`internal/parsers/sys/ack.ts`,
 * `internal/parsers/wan/shared.ts`): write/toggle commands reduce to a
 * trimmed acknowledgement DTO rather than an invented structured shape, and
 * status-style read commands reduce to a minimal enabled/disabled flag.
 */

import { parseRawText, type RawCommandOutput } from "../raw-text.js";

/** Trimmed acknowledgement text (the shared raw-text parser). */
export type LinuxAck = RawCommandOutput;
export const parseLinuxAck: (text: string) => LinuxAck = parseRawText;

export interface LinuxToggleStatus {
  readonly raw: string;
  /** `null` when the output says neither enabled nor disabled. */
  readonly enabled: boolean | null;
}

const ENABLED_PATTERN = /\benabled\b/i;
const DISABLED_PATTERN = /\bdisabled\b/i;

/**
 * Parses a `status`-style response into a minimal enabled/disabled DTO.
 * `enabled` is `true` only when the text mentions "enabled" without also
 * mentioning "disabled" -- an honest, conservative reading rather than a
 * guess when the text is ambiguous or empty.
 */
export function parseLinuxToggleStatus(text: string): LinuxToggleStatus {
  const raw = text.trim();
  const enabled = DISABLED_PATTERN.test(raw) ? false : ENABLED_PATTERN.test(raw) ? true : null;

  return { raw, enabled };
}
