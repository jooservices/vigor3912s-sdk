/**
 * Parser for `dos -A` (`cli.dos.a`, rawLine 812).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseActivate(text: string): RawCommandOutput {
  return parseRawText(text);
}
