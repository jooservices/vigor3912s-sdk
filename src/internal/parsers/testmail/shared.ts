/**
 * Shared minimal parsing helper for the `testmail` domain.
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). The documented `testmail` acknowledgement
 * text is a fixed settings dump (`Mail Alert`, `Interface`, `SMTP_Server`,
 * ...) with no further documented structure worth a bespoke DTO -- this
 * single-operation family reduces to trimming the raw exchange text, same
 * rationale as `internal/parsers/wan/shared.ts`.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}
