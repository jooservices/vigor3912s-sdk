/**
 * `testmail` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4" family
 * task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.testmail` manifest entry
 * (rawLine 9000), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/testmail.ts`, consulted read-only as
 * evidence, never imported/depended on at runtime): a no-argument command
 * that displays current test-mail settings, classified `write` per the
 * sibling's live-verified `W(...)` builder.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in `internal/parsers/testmail/*.ts`
 * (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseSend } from "../internal/parsers/testmail/send.js";
import type { RawCommandOutput } from "../internal/parsers/testmail/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// cli.testmail -- `testmail` (rawLine 9000) -- write, no arguments
// ---------------------------------------------------------------------------

function buildSendFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("testmail")];
}

export const testmailSend: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.testmail",
  classification: "write",
  buildFrames: buildSendFrames,
  parse: (exchanges) => parseSend(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [testmailSend];
