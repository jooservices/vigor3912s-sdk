/**
 * Parser for `srv dhcp off` (`cli.srv.dhcp.off`, rawLine 7134).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOff(text: string): RawCommandOutput {
  return parseRawText(text);
}
