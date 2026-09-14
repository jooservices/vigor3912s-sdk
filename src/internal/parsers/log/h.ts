/**
 * Parser for `log -h` (`cli.log.h`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseH(text: string): RawCommandOutput {
  return parseRawText(text);
}
