/**
 * Parser for `srv dhcp startip` (`cli.srv.dhcp.startip`, rawLine 7161).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseStartip(text: string): RawCommandOutput {
  return parseRawText(text);
}
