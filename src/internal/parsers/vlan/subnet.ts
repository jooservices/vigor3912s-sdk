/**
 * Parser for `vlan subnet` (`cli.vlan.subnet`, rawLine 9462).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSubnet(text: string): RawCommandOutput {
  return parseRawText(text);
}
