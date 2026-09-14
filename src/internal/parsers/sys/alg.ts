/**
 * Pure parser for `sys alg` (`cli.sys.alg`, classification "write").
 * Documented output is a one-line ack (`Enable ALG` / `Disable ALG`,
 * rawLine 8430) -- reuses the shared `parseSysAck` shape (see `./ack.ts`
 * for rationale) rather than duplicating that logic.
 */

export { parseSysAck as parseSysAlg, type SysAck as SysAlg } from "./ack.js";
