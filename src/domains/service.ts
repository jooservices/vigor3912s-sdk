/**
 * `service` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4" family
 * task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.service` manifest entry
 * (rawLine 13038), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/service.ts`, consulted read-only as
 * evidence, never imported/depended on at runtime), classified `read`. The
 * heading documents six sub-forms -- `service -s` (display status), `-r`
 * (refresh), `-l <account> <password>` (login/transfer), `-i <new_owner>
 * <new_owner_email>` (set transfer target), `-t <yes>/<no>` (transfer
 * ownership), `-c` (clear owner) -- only `service -s`, the documented
 * read-only status display, is modelled here (same narrowing pattern as
 * `wan.ts`'s `wanDetect`); the `-r`/`-l`/`-i`/`-t`/`-c` mutating sub-forms
 * are a deliberate YAGNI deferral.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in `internal/parsers/service/*.ts`
 * (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseStatus } from "../internal/parsers/service/status.js";
import type { RawCommandOutput } from "../internal/parsers/service/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// cli.service -- `service -s` (rawLine 13038) -- read, no arguments
// ---------------------------------------------------------------------------

function buildStatusFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("service -s")];
}

export const serviceStatus: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.service",
  classification: "read",
  buildFrames: buildStatusFrames,
  parse: (exchanges) => parseStatus(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [serviceStatus];
