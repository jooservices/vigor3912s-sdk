/**
 * Parser for `ip igmp_proxy set` (`cli.ip.igmpproxy.set`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxySet(text: string): RawCommandOutput {
  return parseRawText(text);
}
