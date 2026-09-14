/**
 * Parser for `ip bgp neighbor show` (`cli.ip.bgp.neighbor.show`, rawLine 1608).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBgpNeighborShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
