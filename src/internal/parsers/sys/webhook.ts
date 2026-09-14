/**
 * Pure parser for `sys webhook` (`cli.sys.webhook`, classification
 * "write"). `sys webhook` has five documented subcommands (`enable`,
 * `send`, `status`, `url`, `period`, rawLine 8972 onward) with distinct
 * output shapes (`status` returns a small settings block, the rest are
 * acks) -- structuring all of them now would be speculative (YAGNI).
 * Reuses the shared `parseSysAck` (trimmed raw text) shape (see `./ack.ts`).
 */

export { parseSysAck as parseSysWebhook, type SysAck as SysWebhook } from "./ack.js";
