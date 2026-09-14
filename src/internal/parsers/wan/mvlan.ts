/**
 * Parser for `wan mvlan` (`cli.wan.mvlan`, rawLine 11120).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMvlan(text: string): RawCommandOutput {
  return parseRawText(text);
}
