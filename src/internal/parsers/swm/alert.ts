/**
 * Parser for `swm alert` (`cli.swm.alert`, rawLine 12778).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmAlert(text: string): RawCommandOutput {
  return parseRawText(text);
}
