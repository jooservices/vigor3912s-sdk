/**
 * Parser for `ip6 dhcp client` (`cli.ip6.dhcp.client`, rawLine 2243).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcpClient(text: string): RawCommandOutput {
  return parseRawText(text);
}
