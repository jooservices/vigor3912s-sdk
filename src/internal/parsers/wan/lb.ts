/**
 * Parser for `wan lb` (`cli.wan.lb`, rawLine 11010).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLb(text: string): RawCommandOutput {
  return parseRawText(text);
}
