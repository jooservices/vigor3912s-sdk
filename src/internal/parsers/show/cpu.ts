/**
 * Parser for `show cpu` (`cli.show.cpu`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowCpu(text: string): RawCommandOutput {
  return parseRawText(text);
}
