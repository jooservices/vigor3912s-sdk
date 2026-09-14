/**
 * Parser for `ip bgp show` (`cli.ip.bgp.show`, rawLine 1608).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBgpShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
