/**
 * Parser for `swm log` (`cli.swm.log`, rawLine 12880).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmLog(text: string): RawCommandOutput {
  return parseRawText(text);
}
