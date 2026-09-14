/**
 * Parser for `ip pubaddr` (`cli.ip.pubaddr`, rawLine 996).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePubaddr(text: string): RawCommandOutput {
  return parseRawText(text);
}
