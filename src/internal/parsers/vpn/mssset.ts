/**
 * Parser for `vpn mss set` (`cli.vpn.mss.set`, rawLine 10490).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMssSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
