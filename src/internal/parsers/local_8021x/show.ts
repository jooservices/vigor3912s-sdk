/**
 * Parser for `local_8021x show` (`cli.local8021x`, rawLine 11727).
 *
 * The documented example (same rawLine) shows one structured line worth
 * extracting -- `% Local 802.1X enable: <enable|disable>` -- so this parser
 * upgrades from the plain `RawCommandOutput` shape used by this family's
 * shared helper to a small typed report, same pattern as
 * `internal/parsers/wan/status.ts` for its one read operation. Text that
 * doesn't match the documented shape still returns the raw text with
 * `enabled: null` rather than guessing.
 */

export interface Local8021xShowReport {
  readonly enabled: boolean | null;
  readonly raw: string;
}

const ENABLE_PATTERN = /Local 802\.1X enable:\s*(enable|disable)/i;

export function parseShow(text: string): Local8021xShowReport {
  const match = ENABLE_PATTERN.exec(text);
  const enabledText = match?.[1];

  return {
    enabled: enabledText === undefined ? null : enabledText.toLowerCase() === "enable",
    raw: text.trim(),
  };
}
