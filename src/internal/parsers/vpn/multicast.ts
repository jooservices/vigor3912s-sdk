/**
 * Parser for `vpn Multicast` (`cli.vpn.multicast`, rawLine 10561).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMulticast(text: string): RawCommandOutput {
  return parseRawText(text);
}
