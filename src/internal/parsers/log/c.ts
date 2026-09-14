/**
 * Parser for `log -c` (`cli.log.c`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseC(text: string): RawCommandOutput {
  return parseRawText(text);
}
