/**
 * Shared minimal parsing helper for the `log` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5's parser signature). Log buffer
 * dumps and flush acknowledgements have no further documented fixed schema
 * worth a bespoke DTO here (column widths / row counts vary by device and
 * traffic).
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
