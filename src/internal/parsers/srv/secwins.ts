/**
 * Parser for `srv dhcp secWINS` (`cli.srv.dhcp.secwins`, rawLine 7243).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSecwins(text: string): RawCommandOutput {
  return parseRawText(text);
}
