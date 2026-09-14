/**
 * Parser for `swm db` (`cli.swm.db`, rawLine 12744).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmDb(text: string): RawCommandOutput {
  return parseRawText(text);
}
