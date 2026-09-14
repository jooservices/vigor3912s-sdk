/**
 * Parser for `apm lbcfg show` (`cli.apm.lbcfg.show`, rawLine 12121).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLbcfgShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
