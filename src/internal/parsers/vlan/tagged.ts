/**
 * Parser for `vlan tagged` (`cli.vlan.tagged`, rawLine 9510).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTagged(text: string): RawCommandOutput {
  return parseRawText(text);
}
