/**
 * Parser for `dos -P show` (`cli.dos.p.show`, rawLine 812).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseWhitelistShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
