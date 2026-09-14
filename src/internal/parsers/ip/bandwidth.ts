/**
 * Parser for `ip bandwidth` (`cli.ip.bandwidth`, rawLine 1492).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBandwidth(text: string): RawCommandOutput {
  return parseRawText(text);
}
