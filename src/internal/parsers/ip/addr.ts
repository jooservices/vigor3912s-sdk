/**
 * Parser for `ip addr` (`cli.ip.addr`, rawLine 1057).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseAddr(text: string): RawCommandOutput {
  return parseRawText(text);
}
