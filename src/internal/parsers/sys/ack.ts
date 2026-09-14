/**
 * Shared pass-through/ack-style parser for `sys` write and destructive
 * operations whose documented output is minimal, absent, or too
 * command-specific to structure meaningfully (`sys domainname`, `sys name`,
 * `sys passwd`, `sys reboot`, `sys autoreboot`, `sys commit`, `sys tftpd`,
 * `sys cfg default`, `sys tr069`, `sys alg`, `sys license`, `sys syslog`,
 * `sys mailalert`, `sys webhook`). Every one of these is documented in
 * `cli-reference-raw.txt` with either a bare `>` prompt or a short one-line
 * acknowledgement (e.g. `% TFTP server enabled !!!`), never a structured
 * table -- an ack/pass-through shape is the accurate representation, not an
 * implementation shortcut.
 */

export interface SysAck {
  readonly raw: string;
}

export function parseSysAck(text: string): SysAck {
  return { raw: text.trim() };
}
