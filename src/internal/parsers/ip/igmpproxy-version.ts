/**
 * Parser for `ip igmp_proxy version` (`cli.ip.igmpproxy.version`, rawLine 1356).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpProxyVersion(text: string): RawCommandOutput {
  return parseRawText(text);
}
