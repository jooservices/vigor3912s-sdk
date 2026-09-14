/**
 * Pure parser for `sys tftpd` (`cli.sys.tftpd`, classification "write").
 * Documented output is a short acknowledgement (`% TFTP server enabled
 * !!!`, rawLine 8062) -- reuses the shared `parseSysAck` shape (see
 * `./ack.ts` for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysTftpd, type SysAck as SysTftpd } from "./ack.js";
