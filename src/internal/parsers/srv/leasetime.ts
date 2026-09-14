/**
 * Parser for `srv dhcp leasetime` (`cli.srv.dhcp.leasetime`, rawLine 7195).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLeasetime(text: string): RawCommandOutput {
  return parseRawText(text);
}
