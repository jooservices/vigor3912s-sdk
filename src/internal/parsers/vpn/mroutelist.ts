/**
 * Parser for `vpn mroute list` (`cli.vpn.mroute.list`, rawLine 10115).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMrouteList(text: string): RawCommandOutput {
  return parseRawText(text);
}
