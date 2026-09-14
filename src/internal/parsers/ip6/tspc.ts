/**
 * Parser for `ip6 tspc` (`cli.ip6.tspc`, rawLine 2750).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTspc(text: string): RawCommandOutput {
  return parseRawText(text);
}
