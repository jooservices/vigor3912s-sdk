/**
 * `wol` domain -- Wave 4 tiny-family batch (`BACKLOG.md` "Wave 4" family task
 * template; `ARCHITECTURE.md` Item 5).
 *
 * Implements the single already-classified `cli.wol` manifest entry (rawLine
 * 11766), basis `sibling-live-verified` (`vigor3912s-mcp`'s
 * `src/commands/registry/families/wol.ts`, consulted read-only as evidence,
 * never imported/depended on at runtime), classified `write`. The heading
 * documents three sub-forms -- `wol up <MAC Address>`, `wol fromWan
 * <on/off/any>`, `wol fromWan_Setting <idx> <ip address> <mask>` -- this
 * operation models the heading's primary documented action, `wol up <MAC
 * Address>` (send the magic packet), per the vendor documentation's own
 * `SSyynnttaaxx` listing order; the `fromWan`/`fromWan_Setting` allow-list
 * sub-forms are a deliberate YAGNI deferral (same one-canonical-variant
 * narrowing as `wan.ts`'s `wanLb`).
 *
 * `parse` is thin: pulls the first exchange's `stdout` and hands it to a
 * pure `(text: string) => TOutput` parser in `internal/parsers/wol/*.ts`
 * (`ARCHITECTURE.md` Item 5's parser signature).
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseUp } from "../internal/parsers/wol/up.js";
import type { RawCommandOutput } from "../internal/parsers/wol/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

function assertMacAddress(value: string, name: string): void {
  if (!MAC_ADDRESS_PATTERN.test(value)) {
    throw new Error(`${name} must be a valid colon-separated MAC address (got "${value}").`);
  }
}

// ---------------------------------------------------------------------------
// cli.wol -- `wol up <MAC Address>` (rawLine 11766) -- write
// ---------------------------------------------------------------------------

export interface WolUpInput {
  readonly macAddress: string;
}

function buildUpFrames(input: WolUpInput): readonly CommandFrame[] {
  assertMacAddress(input.macAddress, "macAddress");

  return [frameSingleCommand(`wol up ${input.macAddress}`)];
}

export const wolUp: TypedOperation<WolUpInput, RawCommandOutput> = {
  manifestId: "cli.wol",
  classification: "write",
  buildFrames: buildUpFrames,
  parse: (exchanges) => parseUp(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [wolUp];
