/**
 * Parser for `ip6 online` (`cli.ip6.online`, rawLine 2874).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOnline(text: string): RawCommandOutput {
  return parseRawText(text);
}
