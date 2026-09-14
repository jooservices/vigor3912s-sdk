/**
 * Parser for `ip bgp` (`cli.ip.bgp`, rawLine 1608).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBgp(text: string): RawCommandOutput {
  return parseRawText(text);
}
