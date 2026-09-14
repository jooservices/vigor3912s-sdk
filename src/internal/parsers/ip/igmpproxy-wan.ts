/**
 * Parser for `ip igmp_proxy wan` (`cli.ip.igmpproxy.wan`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxyWan(text: string): RawCommandOutput {
  return parseRawText(text);
}
