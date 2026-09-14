/**
 * Parser for `ip nmask` (`cli.ip.nmask`, rawLine 1081).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNmask(text: string): RawCommandOutput {
  return parseRawText(text);
}
