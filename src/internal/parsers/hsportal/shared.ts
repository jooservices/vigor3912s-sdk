/**
 * Shared minimal parsing helper for the `hsportal` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement/status text for these commands, not a
 * documented structured response shape -- inventing a richer DTO here would
 * assert detail the vendor documentation does not support (same reasoning as
 * `internal/parsers/wan/shared.ts`).
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
