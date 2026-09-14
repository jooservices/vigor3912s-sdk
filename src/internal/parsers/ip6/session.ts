/**
 * Parser for `ip6 session` (`cli.ip6.session`, rawLine 3014).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSession(text: string): RawCommandOutput {
  return parseRawText(text);
}
