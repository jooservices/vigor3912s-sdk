/**
 * Shared minimal parsing helper for the `msubnet` domain's write operations
 * (`ARCHITECTURE.md` Item 5's per-family parser scope --  a private copy per
 * family, not a shared cross-domain module, so families stay independently
 * parallelizable per `BACKLOG.md`'s Wave 4 write-scope proof).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). DrayOS's serialized CLI gives
 * prompt-delimited acknowledgement text for these write commands, not a
 * documented structured response shape -- inventing a richer DTO here would
 * assert detail the vendor documentation does not support. Only
 * `msubnet status` (this family's one read operation, see `./status.ts`) has
 * enough documented structure to justify a real DTO.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
