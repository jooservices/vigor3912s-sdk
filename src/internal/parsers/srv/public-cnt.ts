/**
 * Parser for `srv dhcp public cnt` (`cli.srv.dhcp.public.cnt`, rawLine 7023).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePublicCnt(text: string): RawCommandOutput {
  return parseRawText(text);
}
