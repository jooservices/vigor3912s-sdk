/**
 * Shared minimal parsing helper for the `port` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5's parser signature). Reused across
 * this family's operations whose documented samples are free-form
 * acknowledgement / status text (no single fixed structured table).
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
