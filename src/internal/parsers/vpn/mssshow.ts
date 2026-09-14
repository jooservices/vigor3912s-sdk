/**
 * Parser for `vpn mss show` (`cli.vpn.mss.show`, rawLine 10490).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMssShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
