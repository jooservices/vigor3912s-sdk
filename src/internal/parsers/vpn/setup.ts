/**
 * Parser for `vpn setup` (`cli.vpn.setup`, rawLine 9861).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSetup(text: string): RawCommandOutput {
  return parseRawText(text);
}
