/**
 * `nand` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4" family
 * task template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.nand.bad.nand.usage`
 * manifest entry (rawLine 11996), basis `sibling-live-verified`
 * (`vigor3912s-mcp`'s `src/commands/registry/families/nand.ts`, consulted
 * read-only as evidence, never imported/depended on at runtime), classified
 * `read`. The raw heading text is `"nand bad /nand usage"` -- coarser than
 * the two real documented commands it covers (`SSyynnttaaxx` block lists
 * `nand bad` and `nand usage` as two separate, argument-free commands; the
 * heading's own prose confirms this: *""NAND usage" is used to display NAND
 * Flash usage; "nand bad" is used to display NAND Flash bad blocks"*). The
 * manifest models this heading as one entry rather than splitting it (unlike
 * the `sys cfg`/`mngt rmtcfg`/`linux` headings that were split per
 * `ARCHITECTURE.md`'s 2026-09-13 amendment) -- splitting this manifest entry
 * is out of scope for this task, so both real commands are modelled here as
 * a discriminated `action` union under the one `cli.nand.bad.nand.usage`
 * `TypedOperation` (same one-entry/multi-variant pattern as `wan.ts`'s
 * `wanVlan`), each a no-argument frame matching the heading's own
 * `SSyynnttaaxx` block exactly (`nand bad`, `nand usage`) -- not the raw
 * `command`/`commandPath` field's literal, generator-produced `"nand bad
 * /nand usage"` heading text, which is not a real, runnable command.
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in `internal/parsers/nand/*.ts`
 * (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseUsage } from "../internal/parsers/nand/usage.js";
import type { RawCommandOutput } from "../internal/parsers/nand/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

// ---------------------------------------------------------------------------
// cli.nand.bad.nand.usage -- `nand bad` / `nand usage` (rawLine 11996) --
// read
// ---------------------------------------------------------------------------

export type NandUsageInput = { readonly action: "bad" } | { readonly action: "usage" };

function buildUsageFrames(input: NandUsageInput): readonly CommandFrame[] {
  return [frameSingleCommand(`nand ${input.action}`)];
}

export const nandUsage: TypedOperation<NandUsageInput, RawCommandOutput> = {
  manifestId: "cli.nand.bad.nand.usage",
  classification: "read",
  buildFrames: buildUsageFrames,
  parse: (exchanges) => parseUsage(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [nandUsage];
