/**
 * Parser for `radius show_local_cer` (`cli.radius.showlocalcer`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowLocalCer(text: string): RawCommandOutput {
  return parseRawText(text);
}
