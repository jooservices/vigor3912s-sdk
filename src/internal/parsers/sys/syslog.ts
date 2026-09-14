/**
 * Pure parser for `sys syslog` (`cli.sys.syslog`, classification "write").
 * Documented output is a bare `>` prompt after the flag string is applied
 * (rawLine 8670) -- reuses the shared `parseSysAck` shape (see `./ack.ts`
 * for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysSyslog, type SysAck as SysSyslog } from "./ack.js";
