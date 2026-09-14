/**
 * Parser for `show memory` (`cli.show.memory`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowMemory(text: string): RawCommandOutput {
  return parseRawText(text);
}
