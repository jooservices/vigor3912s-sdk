/**
 * Shared minimal parsing helper for the `vpn` domain (`Item5-vpn` task).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). None of this family's implemented commands
 * documents a machine-parseable response schema beyond prompt-delimited free
 * text -- reducing every operation to trimmed raw text is the honest DTO,
 * matching `wan.ts`'s own precedent for write acknowledgement text.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
