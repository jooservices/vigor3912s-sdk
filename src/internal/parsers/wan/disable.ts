/**
 * Parser for `wan disable` (`cli.wan.disable`, rawLine 10863).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
