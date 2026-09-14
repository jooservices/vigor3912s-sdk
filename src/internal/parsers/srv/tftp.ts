/**
 * Parser for `srv dhcp tftp` (`cli.srv.dhcp.tftp`, rawLine 7273).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTftp(text: string): RawCommandOutput {
  return parseRawText(text);
}
