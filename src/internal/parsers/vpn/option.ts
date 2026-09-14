/**
 * Parser for `vpn option` (`cli.vpn.option`, rawLine 9937).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOption(text: string): RawCommandOutput {
  return parseRawText(text);
}
