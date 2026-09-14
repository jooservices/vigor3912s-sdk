/**
 * Shared minimal parsing helper for the `ddns` domain's write operations
 * (and its unstructured read operation, `ddns log`).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for these commands, not a documented
 * structured response shape -- inventing a richer DTO here would assert
 * detail the vendor documentation does not support. Mirrors
 * `internal/parsers/wan/shared.ts`'s precedent for this same problem.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
