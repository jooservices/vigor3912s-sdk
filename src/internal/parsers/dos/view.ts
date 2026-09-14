/**
 * Parser for `dos -V` (`cli.dos.v`, rawLine 812).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseView(text: string): RawCommandOutput {
  return parseRawText(text);
}
