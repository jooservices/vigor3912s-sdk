/**
 * Parser for `apm lbcfg set` (`cli.apm.lbcfg.set`, rawLine 12121).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLbcfgSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
