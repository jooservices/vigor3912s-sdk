/**
 * Parser for `vpn trunk` (`cli.vpn.trunk`, rawLine 10228).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTrunk(text: string): RawCommandOutput {
  return parseRawText(text);
}
