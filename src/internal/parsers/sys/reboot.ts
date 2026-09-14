/**
 * Pure parser for `sys reboot` (`cli.sys.reboot`, classification
 * "destructive" in the manifest; see `../../../domains/sys.ts` for why the
 * `TypedOperation` descriptor itself uses "write"). Documented output is a
 * bare `>` prompt (rawLine 8033) -- reuses the shared `parseSysAck` shape
 * (see `./ack.ts` for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysReboot, type SysAck as SysReboot } from "./ack.js";
