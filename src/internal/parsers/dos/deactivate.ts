/**
 * Parser for `dos -D` (`cli.dos.d`, rawLine 812).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseDeactivate(text: string): RawCommandOutput {
  return parseRawText(text);
}
