/**
 * Parser for `vlan sysvid` (`cli.vlan.sysvid`, rawLine 9551).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSysvid(text: string): RawCommandOutput {
  return parseRawText(text);
}
