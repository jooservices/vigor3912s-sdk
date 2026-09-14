/**
 * Pure parser for `sys license` (`cli.sys.license`, classification
 * "write"). `sys license` has six documented subcommands (rawLine 8525
 * onward) with distinct output shapes -- structuring all of them now would
 * be speculative (YAGNI). Reuses the shared `parseSysAck` (trimmed raw
 * text) shape (see `./ack.ts`).
 */

export { parseSysAck as parseSysLicense, type SysAck as SysLicense } from "./ack.js";
