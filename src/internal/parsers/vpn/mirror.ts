/**
 * Parser for `vpn mirror` (`cli.vpn.mirror`, rawLine 10722).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMirror(text: string): RawCommandOutput {
  return parseRawText(text);
}
