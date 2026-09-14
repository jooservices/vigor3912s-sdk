/**
 * Shared minimal parsing helper for the `swm` domain (Wave 4 `Item5-swm`
 * family task; `ARCHITECTURE.md` Item 5).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's documented `swm *` acknowledgement
 * and status text is a mix of free-form prose lines and ragged,
 * PDF-extraction-mangled fixed-width tables (e.g. `swm show`'s switch
 * summary table, `swm group show`'s member list) with no vendor-documented
 * structured schema -- inventing a richer DTO for any of these 13 commands
 * would assert detail the vendor documentation does not actually support
 * (same reasoning as `internal/parsers/wan/shared.ts`, which this mirrors).
 * Every operation in this family therefore reduces to trimming the raw
 * exchange text.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
