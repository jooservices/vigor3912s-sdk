/**
 * Parser for `vpn subnet` (`cli.vpn.subnet`, rawLine 9845).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSubnet(text: string): RawCommandOutput {
  return parseRawText(text);
}
