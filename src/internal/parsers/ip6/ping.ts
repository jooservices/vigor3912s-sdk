/**
 * Parser for `ip6 ping` (`cli.ip6.ping`, rawLine 2692).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePing(text: string): RawCommandOutput {
  return parseRawText(text);
}
