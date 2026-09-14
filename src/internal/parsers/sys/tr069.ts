/**
 * Pure parser for `sys tr069` (`cli.sys.tr069`, classification "write").
 * `sys tr069` has ~20 documented subcommands (rawLine 8133 onward), each
 * with its own output shape (`get`/`getnoti` return parameter values,
 * `log` returns a log dump, `save`/`clear`/`debug`/etc. return short acks).
 * Structuring all of them now would be speculative (YAGNI) -- reuses the
 * shared `parseSysAck` (trimmed raw text) shape (see `./ack.ts`).
 */

export { parseSysAck as parseSysTr069, type SysAck as SysTr069 } from "./ack.js";
