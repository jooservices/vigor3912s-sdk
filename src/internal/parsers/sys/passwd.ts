/**
 * Pure parser for `sys passwd` (`cli.sys.passwd`, classification "write").
 * Documented output is a bare `>` prompt (rawLine 8019, no password ever
 * echoed) -- reuses the shared `parseSysAck` shape (see `./ack.ts` for
 * rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysPasswd, type SysAck as SysPasswd } from "./ack.js";
