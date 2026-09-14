/**
 * Parser for `vpn fromlan remove` (`cli.vpn.fromlan.remove`, rawLine 10736).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFromlanRemove(text: string): RawCommandOutput {
  return parseRawText(text);
}
