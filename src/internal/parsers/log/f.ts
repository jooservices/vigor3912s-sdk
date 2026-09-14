/**
 * Parser for `log -f` (`cli.log.f`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseF(text: string): RawCommandOutput {
  return parseRawText(text);
}
