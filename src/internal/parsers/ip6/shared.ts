/**
 * Shared minimal parsing helper for the `ip6` domain (`cli.ip6.ping` /
 * `cli.ip6.tracert` / `cli.ip6.addr` / `cli.ip6.mngt`).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). These commands are documented via
 * illustrative example transcripts, not a formally specified field grammar
 * -- inventing a richer DTO here would assert detail the vendor
 * documentation does not actually support (same reasoning as
 * `internal/parsers/wan/shared.ts`'s `RawCommandOutput`, deliberately not
 * imported from there: each domain's parsers stay self-contained, per Wave 4's
 * non-overlapping write-scope rule).
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
