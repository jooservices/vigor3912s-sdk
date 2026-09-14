/**
 * Parser for `swm maintain` (`cli.swm.maintain`, rawLine 12698).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmMaintain(text: string): RawCommandOutput {
  return parseRawText(text);
}
