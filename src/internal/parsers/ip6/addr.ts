/**
 * Parser for `ip6 addr` (`cli.ip6.addr`, rawLine 2060).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseAddr(text: string): RawCommandOutput {
  return parseRawText(text);
}
