/**
 * Parser for `srv dhcp dns1` (`cli.srv.dhcp.dns1`, rawLine 7057).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDns1(text: string): RawCommandOutput {
  return parseRawText(text);
}
