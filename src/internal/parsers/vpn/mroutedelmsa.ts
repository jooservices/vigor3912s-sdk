/**
 * Parser for `vpn mroute delmsa` (`cli.vpn.mroute.delmsa`, rawLine 10115).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMrouteDelmsa(text: string): RawCommandOutput {
  return parseRawText(text);
}
