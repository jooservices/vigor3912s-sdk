/**
 * Parser for `vpn dinset` (`cli.vpn.dinset`, rawLine 9673).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDinset(text: string): RawCommandOutput {
  return parseRawText(text);
}
