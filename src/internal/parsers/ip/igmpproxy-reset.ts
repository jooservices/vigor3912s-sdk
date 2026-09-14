/**
 * Parser for `ip igmp_proxy reset` (`cli.ip.igmpproxy.reset`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxyReset(text: string): RawCommandOutput {
  return parseRawText(text);
}
