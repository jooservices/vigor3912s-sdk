/**
 * Shared pass-through/ack-style parser for `mngt` operations whose
 * documented output is a short one-line acknowledgement or a bare `>`
 * prompt (e.g. `% Set FTP server port to 21 done.`, `%% FTP server has been
 * enabled.`), never a structured table -- mirrors `internal/parsers/sys/ack.ts`'s
 * rationale: an ack/pass-through shape is the accurate representation for
 * these commands, not an implementation shortcut.
 */

export interface MngtAck {
  readonly raw: string;
}

export function parseMngtAck(text: string): MngtAck {
  return { raw: text.trim() };
}
