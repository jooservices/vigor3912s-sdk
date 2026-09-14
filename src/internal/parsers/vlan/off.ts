/**
 * Parser for `vlan off` (`cli.vlan.off`, rawLine 9384).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOff(text: string): RawCommandOutput {
  return parseRawText(text);
}
