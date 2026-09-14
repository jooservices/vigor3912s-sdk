/**
 * Parser for `ip igmp_proxy query` (`cli.ip.igmpproxy.query`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxyQuery(text: string): RawCommandOutput {
  return parseRawText(text);
}
