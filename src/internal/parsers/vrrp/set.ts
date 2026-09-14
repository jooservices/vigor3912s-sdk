/**
 * Parser for `vrrp set` (`cli.vrrp.set`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVrrpSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
