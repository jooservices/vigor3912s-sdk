/**
 * Parser for `vpn pass2nd` (`cli.vpn.pass2nd`, rawLine 10576).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePass2nd(text: string): RawCommandOutput {
  return parseRawText(text);
}
