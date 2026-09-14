/**
 * Parser for `ip6 pneigh` (`cli.ip6.pneigh`, rawLine 2603).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePneigh(text: string): RawCommandOutput {
  return parseRawText(text);
}
