/**
 * Parser for `ip6 dhcp option_s` (`cli.ip6.dhcp.options`, rawLine 2411).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcpOptions(text: string): RawCommandOutput {
  return parseRawText(text);
}
