/**
 * Parser for `vpn mroute addmsa` (`cli.vpn.mroute.addmsa`, rawLine 10115).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMrouteAddmsa(text: string): RawCommandOutput {
  return parseRawText(text);
}
