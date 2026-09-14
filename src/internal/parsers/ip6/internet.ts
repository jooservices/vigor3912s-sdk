/**
 * Parser for `ip6 internet` (`cli.ip6.internet`, rawLine 2449).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseInternet(text: string): RawCommandOutput {
  return parseRawText(text);
}
