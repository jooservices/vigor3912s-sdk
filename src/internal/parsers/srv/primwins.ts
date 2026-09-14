/**
 * Parser for `srv dhcp primWINS` (`cli.srv.dhcp.primwins`, rawLine 7228).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePrimwins(text: string): RawCommandOutput {
  return parseRawText(text);
}
