/**
 * Parser for `ip rip` (`cli.ip.rip`, rawLine 1261).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRip(text: string): RawCommandOutput {
  return parseRawText(text);
}
