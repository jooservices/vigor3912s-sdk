/**
 * Parser for `wan detect_mtu6` (`cli.wan.detectmtu6`, rawLine 11313).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDetectMtu6(text: string): RawCommandOutput {
  return parseRawText(text);
}
