/**
 * Shared minimal parsing helper for the `ipf` domain's write operations
 * (`cli.ipf.set`, `cli.ipf.rule`).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). Neither heading documents a structured
 * acknowledgement response for its mutating sub-forms (only `ipf view`'s
 * `-V`/`-d` example shows real structured output, see `./view.ts`) --
 * inventing a richer DTO here would assert detail the vendor documentation
 * does not support, so these write operations reduce to trimming the raw
 * exchange text (same pattern as `internal/parsers/wan/shared.ts`).
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
