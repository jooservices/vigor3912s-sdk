/**
 * Parser for `ip6 tracert` (`cli.ip6.tracert`, rawLine 2721).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTracert(text: string): RawCommandOutput {
  return parseRawText(text);
}
