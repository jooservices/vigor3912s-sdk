/**
 * `vrrp` domain -- live-firmware-recon entries (`cli.vrrp.*`).
 *
 * Shapes match sibling `vigor3912s-mcp` `vrrp` family (read-only evidence):
 * - `show` / `apply` / `reset`: bare frames
 * - `enable`: `on` / `off` argument
 * - `set`: opaque validated `param` string
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseVrrpApply } from "../internal/parsers/vrrp/apply.js";
import { parseVrrpEnable } from "../internal/parsers/vrrp/enable.js";
import { parseVrrpReset } from "../internal/parsers/vrrp/reset.js";
import { parseVrrpSet } from "../internal/parsers/vrrp/set.js";
import { parseVrrpShow } from "../internal/parsers/vrrp/show.js";
import type { RawCommandOutput } from "../internal/parsers/vrrp/shared.js";
import { assertOneOf, assertParamTail, firstExchangeText } from "../internal/domain-support.js";

function buildShowFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vrrp show")];
}

export const vrrpShow: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vrrp.show",
  classification: "read",
  buildFrames: buildShowFrames,
  parse: (exchanges) => parseVrrpShow(firstExchangeText(exchanges)),
};

export interface VrrpEnableInput {
  readonly onOff: "on" | "off";
}

function buildEnableFrames(input: VrrpEnableInput): readonly CommandFrame[] {
  assertOneOf(input.onOff, ["on", "off"], "onOff");

  return [frameSingleCommand(`vrrp enable ${input.onOff}`)];
}

export const vrrpEnable: TypedOperation<VrrpEnableInput, RawCommandOutput> = {
  manifestId: "cli.vrrp.enable",
  classification: "write",
  buildFrames: buildEnableFrames,
  parse: (exchanges) => parseVrrpEnable(firstExchangeText(exchanges)),
};

export interface VrrpSetInput {
  readonly param: string;
}

function buildSetFrames(input: VrrpSetInput): readonly CommandFrame[] {
  // `vrrp set` syntax is undocumented (live-recon only): dash tokens pass through.
  assertParamTail(input.param, "param", { flags: "any" });

  return [frameSingleCommand(`vrrp set ${input.param}`)];
}

export const vrrpSet: TypedOperation<VrrpSetInput, RawCommandOutput> = {
  manifestId: "cli.vrrp.set",
  classification: "write",
  buildFrames: buildSetFrames,
  parse: (exchanges) => parseVrrpSet(firstExchangeText(exchanges)),
};

function buildApplyFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vrrp apply")];
}

export const vrrpApply: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vrrp.apply",
  classification: "write",
  buildFrames: buildApplyFrames,
  parse: (exchanges) => parseVrrpApply(firstExchangeText(exchanges)),
};

function buildResetFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("vrrp reset")];
}

export const vrrpReset: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.vrrp.reset",
  classification: "write",
  buildFrames: buildResetFrames,
  parse: (exchanges) => parseVrrpReset(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [
  vrrpShow,
  vrrpEnable,
  vrrpSet,
  vrrpApply,
  vrrpReset,
];
