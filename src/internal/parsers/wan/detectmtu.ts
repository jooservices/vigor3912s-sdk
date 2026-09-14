/**
 * Parser for `wan detect_mtu` (`cli.wan.detectmtu`, rawLine 11287).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDetectMtu(text: string): RawCommandOutput {
  return parseRawText(text);
}
