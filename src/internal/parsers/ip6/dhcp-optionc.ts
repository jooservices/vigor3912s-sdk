/**
 * Parser for `ip6 dhcp option_c` (`cli.ip6.dhcp.optionc`, rawLine 2373).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcpOptionc(text: string): RawCommandOutput {
  return parseRawText(text);
}
