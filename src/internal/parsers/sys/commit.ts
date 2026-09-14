/**
 * Pure parser for `sys commit` (`cli.sys.commit`, classification "write").
 * Documented output is a bare `>` prompt (rawLine 8056) -- reuses the
 * shared `parseSysAck` shape (see `./ack.ts` for rationale) rather than
 * duplicating that logic.
 */

export { parseSysAck as parseSysCommit, type SysAck as SysCommit } from "./ack.js";
