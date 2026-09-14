/**
 * `dpdk` domain -- live-firmware-recon bare reads (`cli.dpdk.*`).
 *
 * Sibling `vigor3912s-mcp` `dpdk` family consulted read-only as evidence.
 * Both commands are no-argument reads; parsers reduce to trimmed raw text.
 */

import { frameSingleCommand, type CommandFrame } from "../internal/execution/framing.js";
import type { CommandExchange } from "../internal/execution/transport.js";
import type { TypedOperation } from "../internal/registry/operation.js";
import { parseDpdkCmdlog } from "../internal/parsers/dpdk/cmdlog.js";
import { parseDpdkStatistic } from "../internal/parsers/dpdk/statistic.js";
import type { RawCommandOutput } from "../internal/parsers/dpdk/shared.js";

function firstExchangeText(exchanges: readonly unknown[]): string {
  const [first] = exchanges as readonly CommandExchange[];
  return first?.stdout ?? "";
}

function buildStatisticFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dpdk statistic")];
}

export const dpdkStatistic: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dpdk.statistic",
  classification: "read",
  buildFrames: buildStatisticFrames,
  parse: (exchanges) => parseDpdkStatistic(firstExchangeText(exchanges)),
};

function buildCmdlogFrames(): readonly CommandFrame[] {
  return [frameSingleCommand("dpdk cmdlog")];
}

export const dpdkCmdlog: TypedOperation<void, RawCommandOutput> = {
  manifestId: "cli.dpdk.cmdlog",
  classification: "read",
  buildFrames: buildCmdlogFrames,
  parse: (exchanges) => parseDpdkCmdlog(firstExchangeText(exchanges)),
};

export const operations: readonly TypedOperation<never, unknown>[] = [dpdkStatistic, dpdkCmdlog];
