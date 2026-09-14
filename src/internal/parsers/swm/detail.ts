/**
 * Parser for `swm detail` (`cli.swm.detail`, rawLine 12604).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmDetail(text: string): RawCommandOutput {
  return parseRawText(text);
}
