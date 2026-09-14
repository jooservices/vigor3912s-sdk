/**
 * Parser for `vpn pass2nat` (`cli.vpn.pass2nat`, rawLine 10593).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePass2nat(text: string): RawCommandOutput {
  return parseRawText(text);
}
