/**
 * Parser for `ip pubmask` (`cli.ip.pubmask`, rawLine 1014).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePubmask(text: string): RawCommandOutput {
  return parseRawText(text);
}
