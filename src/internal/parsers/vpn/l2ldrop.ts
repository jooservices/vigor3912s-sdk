/**
 * Parser for `vpn l2lDrop` (`cli.vpn.l2ldrop`, rawLine 9632).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseL2lDrop(text: string): RawCommandOutput {
  return parseRawText(text);
}
