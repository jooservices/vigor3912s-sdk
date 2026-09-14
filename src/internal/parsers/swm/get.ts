/**
 * Parser for `swm get` (`cli.swm.get`, rawLine 12482).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmGet(text: string): RawCommandOutput {
  return parseRawText(text);
}
