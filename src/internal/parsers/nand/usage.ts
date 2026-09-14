/**
 * Parser for `nand bad` / `nand usage` (`cli.nand.bad.nand.usage`, rawLine
 * 11996).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUsage(text: string): RawCommandOutput {
  return parseRawText(text);
}
