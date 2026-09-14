/**
 * Parser for `ip6 mngt` (`cli.ip6.mngt`, rawLine 2834).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMngt(text: string): RawCommandOutput {
  return parseRawText(text);
}
