/**
 * `local_8021x` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4"
 * family task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.local8021x` manifest entry
 * (rawLine 11727), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/local_8021x.ts`, consulted read-only as
 * evidence, never imported/depended on at runtime). The heading documents
 * four sub-forms -- `local_8021x enable <0/1>`, `local_8021x
 * set_localdot1x_method -e/-d <method_idx>`, and `local_8021x show` -- but
 * the manifest models this heading as one entry classified `read`. Only the
 * documented read sub-form (`local_8021x show`) is modelled here; the
 * `enable`/`set_localdot1x_method` write sub-forms are narrowed out (same
 * pattern as `wan.ts`'s `wanDetect`: the `TypedOperation`'s own
 * `classification` must honestly describe what it does) -- a deliberate
 * YAGNI deferral, not an oversight.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in
 * `internal/parsers/local_8021x/*.ts` (`ARCHITECTURE.md` Item 5's parser
 * signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseShow, type Local8021xShowReport } from "../internal/parsers/local_8021x/show.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// cli.local8021x -- `local_8021x show` (rawLine 11727) -- read, no arguments
// ---------------------------------------------------------------------------

function buildShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("local_8021x show")];
}

export const local8021xShow: TypedOperation<void, Local8021xShowReport> = {
  manifestId: "cli.local8021x",
  classification: "read",
  buildFrames: buildShowFrames,
  parse: (exchanges) => parseShow(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [local8021xShow];
