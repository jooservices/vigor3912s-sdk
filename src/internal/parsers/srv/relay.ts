/**
 * Parser for `srv dhcp relay` (`cli.srv.dhcp.relay`, rawLine 7140).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRelay(text: string): RawCommandOutput {
  return parseRawText(text);
}
