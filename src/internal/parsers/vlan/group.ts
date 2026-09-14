/**
 * Parser for `vlan group` (`cli.vlan.group`, rawLine 9336).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseGroup(text: string): RawCommandOutput {
  return parseRawText(text);
}
