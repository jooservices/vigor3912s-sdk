/**
 * Parser for `log -x` (`cli.log.x`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseX(text: string): RawCommandOutput {
  return parseRawText(text);
}
