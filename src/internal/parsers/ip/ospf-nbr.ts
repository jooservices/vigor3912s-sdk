/**
 * Parser for `ip ospf nbr` (`cli.ip.ospf.nbr`, rawLine 1730).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOspfNbr(text: string): RawCommandOutput {
  return parseRawText(text);
}
