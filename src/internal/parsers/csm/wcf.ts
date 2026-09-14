/**
 * Parser for `csm wcf` (`cli.csm.wcf`, rawLine 383).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseWcf(text: string): RawCommandOutput {
  return parseRawText(text);
}
