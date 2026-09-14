/**
 * Parser for `vrrp apply` (`cli.vrrp.apply`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVrrpApply(text: string): RawCommandOutput {
  return parseRawText(text);
}
