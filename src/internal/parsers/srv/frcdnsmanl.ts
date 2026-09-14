/**
 * Parser for `srv dhcp frcdnsmanl` (`cli.srv.dhcp.frcdnsmanl`, rawLine 7094).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFrcdnsmanl(text: string): RawCommandOutput {
  return parseRawText(text);
}
