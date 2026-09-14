/**
 * Shared minimal parsing helper for the `nand` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5's parser signature). Reused across
 * this family's (currently single) operation, same rationale as
 * `internal/parsers/wan/shared.ts`. `nand usage`'s partition table and
 * `nand bad`'s bad-block listing have no further documented fixed schema
 * (column widths/row counts vary by device) worth a bespoke DTO here.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
