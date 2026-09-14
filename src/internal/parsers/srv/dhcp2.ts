/**
 * Parser for `srv dhcp dhcp2` (`cli.srv.dhcp.dhcp2`, rawLine 6988).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcp2(text: string): RawCommandOutput {
  return parseRawText(text);
}
