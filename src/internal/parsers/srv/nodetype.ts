/**
 * Parser for `srv dhcp nodetype` (`cli.srv.dhcp.nodetype`, rawLine 7208).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNodetype(text: string): RawCommandOutput {
  return parseRawText(text);
}
