/**
 * Pure parser for `sys name` (`cli.sys.name`, classification "write").
 * Documented output is a short acknowledgement/echo of the new setting
 * (rawLine 8001) -- reuses the shared `parseSysAck` shape (see `./ack.ts`
 * for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysName, type SysAck as SysName } from "./ack.js";
