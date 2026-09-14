/**
 * Parser for `ip6 lan` (`cli.ip6.lan`, rawLine 2934).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLan(text: string): RawCommandOutput {
  return parseRawText(text);
}
