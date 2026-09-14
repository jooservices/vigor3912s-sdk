/**
 * Parser for `srv dhcp dns2` (`cli.srv.dhcp.dns2`, rawLine 7075).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDns2(text: string): RawCommandOutput {
  return parseRawText(text);
}
