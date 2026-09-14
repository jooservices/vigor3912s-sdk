/**
 * Parser for `ip ospf dis` (`cli.ip.ospf.dis`, rawLine 1730).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOspfDis(text: string): RawCommandOutput {
  return parseRawText(text);
}
