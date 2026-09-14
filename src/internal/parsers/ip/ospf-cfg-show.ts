/**
 * Parser for `ip ospf cfg show` (`cli.ip.ospf.cfg.show`, rawLine 1730).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOspfCfgShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
