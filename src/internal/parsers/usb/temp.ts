/**
 * Parser for `usb temp show` / `usb temp all_data` (`cli.usb.temp`,
 * rawLine 9211).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5). The documented heading gives no
 * structured example output for the `show`/`all_data` read sub-forms (only
 * the `set -r` write-summary sub-form has a printed example) -- consistent
 * with `wan.ts`'s `internal/parsers/wan/shared.ts` precedent for
 * commands whose documented response is prompt-delimited acknowledgement
 * text rather than a documented structured shape, this parser reduces to
 * trimming the raw exchange text rather than inventing an undocumented DTO.
 */

export interface UsbTempReport {
  readonly raw: string;
}

export function parseTemp(text: string): UsbTempReport {
  return { raw: text.trim() };
}
