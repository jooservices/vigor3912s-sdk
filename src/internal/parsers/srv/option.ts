/**
 * Parser for `srv dhcp option` (`cli.srv.dhcp.option`, rawLine 7300).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOption(text: string): RawCommandOutput {
  return parseRawText(text);
}
