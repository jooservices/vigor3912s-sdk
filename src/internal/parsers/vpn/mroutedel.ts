/**
 * Parser for `vpn mroute del` (`cli.vpn.mroute.del`, rawLine 10115).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMrouteDel(text: string): RawCommandOutput {
  return parseRawText(text);
}
