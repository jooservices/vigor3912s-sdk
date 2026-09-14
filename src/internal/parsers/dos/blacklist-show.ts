/**
 * Parser for `dos -B show` (`cli.dos.b.show`, rawLine 812).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseBlacklistShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
