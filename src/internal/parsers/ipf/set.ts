/**
 * Parser for `ipf set` (`cli.ipf.set`, rawLine 3125).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
