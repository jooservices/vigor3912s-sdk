/**
 * Parser for `vrrp enable` (`cli.vrrp.enable`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVrrpEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
