/**
 * Parser for `srv dhcp tftpdel` (`cli.srv.dhcp.tftpdel`, rawLine 7285).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTftpdel(text: string): RawCommandOutput {
  return parseRawText(text);
}
