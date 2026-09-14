/**
 * Parser for `ip bindmac` (`cli.ip.bindmac`, rawLine 1555).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseBindmac(text: string): RawCommandOutput {
  return parseRawText(text);
}
