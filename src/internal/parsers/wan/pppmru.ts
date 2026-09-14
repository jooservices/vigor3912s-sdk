/**
 * Parser for `wan ppp_mru` (`cli.wan.pppmru`, rawLine 10778).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePppMru(text: string): RawCommandOutput {
  return parseRawText(text);
}
