/**
 * Parser for `ip arp` (`cli.ip.arp`, rawLine 1091).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseArp(text: string): RawCommandOutput {
  return parseRawText(text);
}
