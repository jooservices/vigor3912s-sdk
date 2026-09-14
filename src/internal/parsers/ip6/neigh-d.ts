/**
 * Parser for `ip6 neigh -d` (`cli.ip6.neigh.d`, rawLine 2559).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNeighD(text: string): RawCommandOutput {
  return parseRawText(text);
}
