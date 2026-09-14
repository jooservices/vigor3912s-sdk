/**
 * Parser for `vrrp show` (`cli.vrrp.show`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVrrpShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
