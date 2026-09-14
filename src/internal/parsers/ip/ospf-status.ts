/**
 * Parser for `ip ospf status` (`cli.ip.ospf.status`, rawLine 1730).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOspfStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
