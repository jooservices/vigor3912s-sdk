/**
 * Parser for `ip igmp_proxy status` (`cli.ip.igmpproxy.status`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxyStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
