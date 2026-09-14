/**
 * Parser for `vlan vid` (`cli.vlan.vid`, rawLine 9537).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVid(text: string): RawCommandOutput {
  return parseRawText(text);
}
