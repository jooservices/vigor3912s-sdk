/**
 * Parser for `ip6 neigh -s` (`cli.ip6.neigh.s`, rawLine 2559).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNeighS(text: string): RawCommandOutput {
  return parseRawText(text);
}
