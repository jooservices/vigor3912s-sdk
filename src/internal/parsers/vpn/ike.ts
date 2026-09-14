/**
 * Parser for `vpn ike` (`cli.vpn.ike`, rawLine 10547).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIke(text: string): RawCommandOutput {
  return parseRawText(text);
}
