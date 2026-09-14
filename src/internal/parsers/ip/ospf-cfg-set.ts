/**
 * Parser for `ip ospf cfg set` (`cli.ip.ospf.cfg.set`, rawLine 1730).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOspfCfgSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
