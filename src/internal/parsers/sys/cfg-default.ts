/**
 * Pure parser for `sys cfg default` (`cli.sys.cfg.default`, classification
 * "destructive" in the manifest; see `../../../domains/sys.ts` for why the
 * `TypedOperation` descriptor itself uses "write"). Documented output is a
 * bare `>` prompt (rawLine 7907) -- reuses the shared `parseSysAck` shape
 * (see `./ack.ts` for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysCfgDefault, type SysAck as SysCfgDefault } from "./ack.js";
