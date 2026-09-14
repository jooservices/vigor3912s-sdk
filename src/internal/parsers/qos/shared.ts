/**
 * Shared minimal parsing helper for the `qos` domain's write operations
 * (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature `(text: string)
 * => TOutput`"). Both `qos setup` and `qos class` only document free-form
 * acknowledgement text (see the `> qos setup ...` / `> qos class ...`
 * examples at rawLine 6452 / 6515) rather than a structured response shape
 * -- inventing a richer DTO here would assert detail the vendor
 * documentation does not support (same reasoning as `internal/parsers/wan/
 * shared.ts` and `internal/parsers/srv/shared.ts`).
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
