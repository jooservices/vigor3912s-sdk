/**
 * Parser for `vpn mss default` (`cli.vpn.mss.default`, rawLine 10490).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMssDefault(text: string): RawCommandOutput {
  return parseRawText(text);
}
