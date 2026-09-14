/**
 * Parser for `swm search` (`cli.swm.search`, rawLine 12720).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmSearch(text: string): RawCommandOutput {
  return parseRawText(text);
}
