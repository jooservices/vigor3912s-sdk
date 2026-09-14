/**
 * Parser for `wan forward` (`cli.wan.forward`, rawLine 10873).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseForward(text: string): RawCommandOutput {
  return parseRawText(text);
}
