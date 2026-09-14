/**
 * Pure parser for `sys autoreboot` (`cli.sys.autoreboot`, classification
 * "write"). Documented output varies by argument (`on`/`off` vs. an hours
 * schedule, rawLine 8039) -- reuses the shared `parseSysAck` shape (see
 * `./ack.ts` for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysAutoreboot, type SysAck as SysAutoreboot } from "./ack.js";
