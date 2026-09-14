/**
 * Parser for `vpn l2lset` (`cli.vpn.l2lset`, rawLine 9570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseL2lSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
