/**
 * Parser for `ip6 dhcp req_opt` (`cli.ip6.dhcp.reqopt`, rawLine 2205).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcpReqopt(text: string): RawCommandOutput {
  return parseRawText(text);
}
