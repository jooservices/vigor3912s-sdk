/**
 * Shared minimal parsing helper for the `tacacsplus` domain's write
 * operation.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for `tacacsplus set` (e.g.
 * "TACACS+ enabled!", "TACACS+ Server IP has been setting."), not one
 * documented structured response shape shared across its five `-e`/`-i`/
 * `-p`/`-s`/`-C` variants -- inventing a richer DTO here would assert detail
 * the vendor documentation does not support. Only `tacacsplus view` (the
 * family's one read operation, rawLine 4152) has enough documented structure
 * to justify a real DTO (see `./view.ts`). Mirrors `internal/parsers/wan/
 * shared.ts`'s identical rationale for that family's write operations.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
