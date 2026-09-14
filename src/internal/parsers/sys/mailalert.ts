/**
 * Pure parser for `sys mailalert` (`cli.sys.mailalert`, classification
 * "write"). Documented output is a short acknowledgement (rawLine 8710) --
 * reuses the shared `parseSysAck` shape (see `./ack.ts` for rationale)
 * rather than duplicating that logic.
 */

export { parseSysAck as parseSysMailalert, type SysAck as SysMailalert } from "./ack.js";
