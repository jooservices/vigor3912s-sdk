/**
 * Parser for `ip bgp static show` (`cli.ip.bgp.static.show`, rawLine 1608).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBgpStaticShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
