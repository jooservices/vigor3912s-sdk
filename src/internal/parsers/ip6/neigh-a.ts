/**
 * Parser for `ip6 neigh -a` (`cli.ip6.neigh.a`, rawLine 2559).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNeighA(text: string): RawCommandOutput {
  return parseRawText(text);
}
