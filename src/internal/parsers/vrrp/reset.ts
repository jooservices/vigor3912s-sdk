/**
 * Parser for `vrrp reset` (`cli.vrrp.reset`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVrrpReset(text: string): RawCommandOutput {
  return parseRawText(text);
}
