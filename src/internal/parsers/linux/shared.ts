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

export interface LinuxAck {
  readonly raw: string;
}

/** Trims the raw exchange text into a minimal, honest acknowledgement DTO. */
export function parseLinuxAck(text: string): LinuxAck {
  return { raw: text.trim() };
}

export interface LinuxToggleStatus {
  readonly raw: string;
  readonly enabled: boolean;
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
  const enabled = ENABLED_PATTERN.test(raw) && !DISABLED_PATTERN.test(raw);

  return { raw, enabled };
}
