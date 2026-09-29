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
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseUp } from "../internal/parsers/wol/up.js";
import type { RawCommandOutput } from "../internal/parsers/wol/shared.js";
import {
  assertIpv4,
  assertMac,
  assertOneOf,
  assertPositiveInteger,
  defineRawOperation,
  firstExchangeText,
} from "../internal/domain-support.js";

// ---------------------------------------------------------------------------
// cli.wol -- `wol up <MAC Address>` (rawLine 11766) -- write
// ---------------------------------------------------------------------------

/** `wol up <MAC>`; fw 4.4.7_RC2 help also accepts `wol up <IP Address>`. */
export type WolUpInput = { readonly macAddress: string } | { readonly ipAddress: string };

function buildUpFrames(input: WolUpInput): readonly CommandFrame[] {
  if ("ipAddress" in input) {
    assertIpv4(input.ipAddress, "ipAddress");

    return [frameSingleCommand(`wol up ${input.ipAddress}`)];
  }

  assertMac(input.macAddress, "macAddress");

  return [frameSingleCommand(`wol up ${input.macAddress}`)];
}

export const wolUp: TypedOperation<WolUpInput, RawCommandOutput> = {
  manifestId: "cli.wol",
  classification: "write",
  buildFrames: buildUpFrames,
  parse: (exchanges) => parseUp(firstExchangeText(exchanges)),
};

// `wol fromWan <on/off/any>`, `wol fromWan_Setting <idx> <ip> <mask>`
// (rawLine 11766): which WAN sources may send magic packets through NAT.
export interface WolFromWanInput {
  readonly mode: "on" | "off" | "any";
}

export const wolFromWan = defineRawOperation<WolFromWanInput>(
  "cli.wol.fromwan",
  "write",
  (input) => {
    assertOneOf(input.mode, ["on", "off", "any"], "mode");
    return `wol fromWan ${input.mode}`;
  },
);

export interface WolFromWanSettingInput {
  readonly index: number;
  readonly ipAddress: string;
  readonly mask: string;
}

export const wolFromWanSetting = defineRawOperation<WolFromWanSettingInput>(
  "cli.wol.fromwansetting",
  "write",
  (input) => {
    assertPositiveInteger(input.index, "index");
    assertIpv4(input.ipAddress, "ipAddress");
    assertIpv4(input.mask, "mask");
    return `wol fromWan_Setting ${String(input.index)} ${input.ipAddress} ${input.mask}`;
  },
);

export const operations: readonly TypedOperation<never, unknown>[] = [
  wolUp,
  wolFromWan,
  wolFromWanSetting,
];
