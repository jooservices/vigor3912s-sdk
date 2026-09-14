/**
 * Parser for `vpn list` (`cli.vpn.list`, rawLine 10146).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseList(text: string): RawCommandOutput {
  return parseRawText(text);
}
