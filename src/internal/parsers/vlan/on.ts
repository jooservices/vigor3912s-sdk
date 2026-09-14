/**
 * Parser for `vlan on` (`cli.vlan.on`, rawLine 9396).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOn(text: string): RawCommandOutput {
  return parseRawText(text);
}
