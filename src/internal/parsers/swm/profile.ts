/**
 * Parser for `swm profile` (`cli.swm.profile`, rawLine 12574).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmProfile(text: string): RawCommandOutput {
  return parseRawText(text);
}
