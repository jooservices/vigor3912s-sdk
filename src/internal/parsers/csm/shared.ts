/**
 * Shared minimal parsing helper for the `csm` domain's write operations
 * (`BACKLOG.md` Wave 4 `csm` family task; `ARCHITECTURE.md` Item 5).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for these write commands, not a
 * documented structured response shape -- inventing a richer DTO here would
 * assert detail the vendor documentation does not support. Every write
 * operation in this family therefore reduces to trimming the raw exchange
 * text; only `csm appe show` (this family's one read operation, see
 * `./appe-show.ts`) has enough documented tabular structure to justify a
 * real DTO.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
