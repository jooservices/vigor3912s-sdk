/**
 * Shared minimal parsing helper for the `service` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5's parser signature). Reused across
 * this family's (currently single) operation, same rationale as
 * `internal/parsers/wan/shared.ts`.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
