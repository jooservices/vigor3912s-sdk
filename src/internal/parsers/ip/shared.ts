/**
 * Shared minimal parsing helper for the `ip` domain's write operations
 * (`Item5-ip`, `BACKLOG.md` "Wave 4" family task template).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for these write commands, not a
 * documented structured response shape -- inventing a richer DTO here would
 * assert detail the vendor documentation does not support (mirrors
 * `internal/parsers/wan/shared.ts`'s identical rationale for that sibling
 * family). Only `ip ping`/`ip tracert` (this family's two read operations,
 * see `./ping.ts` / `./tracert.ts`) have enough documented structure to
 * justify real DTOs.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
