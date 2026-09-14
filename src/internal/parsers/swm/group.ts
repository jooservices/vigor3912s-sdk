/**
 * Parser for `swm group` (`cli.swm.group`, rawLine 12529).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmGroup(text: string): RawCommandOutput {
  return parseRawText(text);
}
