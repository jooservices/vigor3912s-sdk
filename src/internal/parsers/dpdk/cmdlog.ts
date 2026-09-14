/**
 * Parser for `dpdk cmdlog` (`cli.dpdk.cmdlog`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDpdkCmdlog(text: string): RawCommandOutput {
  return parseRawText(text);
}
