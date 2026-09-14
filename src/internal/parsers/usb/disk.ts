/**
 * Parser for `usb disk` (`cli.usb.disk`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDisk(text: string): RawCommandOutput {
  return parseRawText(text);
}
