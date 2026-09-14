/**
 * Parser for `ip6 bandwidth` (`cli.ip6.bandwidth`, rawLine 3053).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBandwidth(text: string): RawCommandOutput {
  return parseRawText(text);
}
