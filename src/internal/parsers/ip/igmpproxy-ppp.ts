/**
 * Parser for `ip igmp_proxy ppp` (`cli.ip.igmpproxy.ppp`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxyPpp(text: string): RawCommandOutput {
  return parseRawText(text);
}
