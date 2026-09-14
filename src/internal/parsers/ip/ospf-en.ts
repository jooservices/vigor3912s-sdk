/**
 * Parser for `ip ospf en` (`cli.ip.ospf.en`, rawLine 1730).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOspfEn(text: string): RawCommandOutput {
  return parseRawText(text);
}
