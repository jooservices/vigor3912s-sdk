/**
 * Parser for `log -F a|c|f|w` (`cli.log.F`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseFlush(text: string): RawCommandOutput {
  return parseRawText(text);
}
