/**
 * Shared minimal parsing helper for the `switch` domain's operations whose
 * documented output has no further exploitable structure.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). Mirrors `internal/parsers/wan/shared.ts`'s
 * precedent for the same reasoning: DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for `switch on` / `switch off`, and
 * `switch query`'s bare (no-argument) form has no documented sample output
 * of its own (only the `on`/`off` toggle variants are shown in the vendor
 * text, and those are out of scope -- see `src/domains/switch.ts`) -- so
 * these operations reduce to trimming the raw exchange text rather than
 * inventing a richer DTO the documentation doesn't support.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
