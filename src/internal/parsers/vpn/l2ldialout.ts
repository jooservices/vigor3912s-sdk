/**
 * Parser for `vpn l2lDialout` (`cli.vpn.l2ldialout`, rawLine 9656).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseL2lDialout(text: string): RawCommandOutput {
  return parseRawText(text);
}
