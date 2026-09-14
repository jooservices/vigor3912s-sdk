/**
 * Parser for `vpn dial_out` (`cli.vpn.dialout`, rawLine 10706).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDialOut(text: string): RawCommandOutput {
  return parseRawText(text);
}
