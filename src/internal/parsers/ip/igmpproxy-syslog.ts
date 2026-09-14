/**
 * Parser for `ip igmp_proxy syslog` (`cli.ip.igmpproxy.syslog`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxySyslog(text: string): RawCommandOutput {
  return parseRawText(text);
}
