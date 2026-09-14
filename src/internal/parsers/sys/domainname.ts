/**
 * Pure parser for `sys domainname` (`cli.sys.domainname`, classification
 * "write"). Documented output is a short acknowledgement/echo of the new
 * setting (rawLine 7939) -- reuses the shared `parseSysAck` shape (see
 * `./ack.ts` for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysDomainname, type SysAck as SysDomainname } from "./ack.js";
