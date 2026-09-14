/**
 * Parser for `dpdk statistic` (`cli.dpdk.statistic`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDpdkStatistic(text: string): RawCommandOutput {
  return parseRawText(text);
}
