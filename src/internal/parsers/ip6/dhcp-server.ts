/**
 * Parser for `ip6 dhcp server` (`cli.ip6.dhcp.server`, rawLine 2302).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcpServer(text: string): RawCommandOutput {
  return parseRawText(text);
}
