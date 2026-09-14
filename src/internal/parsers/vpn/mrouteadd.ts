/**
 * Parser for `vpn mroute add` (`cli.vpn.mroute.add`, rawLine 10115).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMrouteAdd(text: string): RawCommandOutput {
  return parseRawText(text);
}
