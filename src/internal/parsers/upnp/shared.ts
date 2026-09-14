/**
 * Shared minimal parsing helper for the `upnp` domain's write operations.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for `upnp on`/`upnp off` (e.g.
 * "UPNP start." / "UPNP say bye-bye"), not a documented structured response
 * shape -- inventing a richer DTO here would assert detail the vendor
 * documentation does not support. Only `upnp nat` (this family's one read
 * operation, see `./nat.ts`) has enough documented structure to justify a
 * real DTO.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
