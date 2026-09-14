/**
 * Parser for `wan budget` (`cli.wan.budget`, rawLine 11223).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBudget(text: string): RawCommandOutput {
  return parseRawText(text);
}
