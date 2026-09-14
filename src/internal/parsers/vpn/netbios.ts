/**
 * Parser for `vpn NetBios` (`cli.vpn.netbios`, rawLine 10469).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNetBios(text: string): RawCommandOutput {
  return parseRawText(text);
}
