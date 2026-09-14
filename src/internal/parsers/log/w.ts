/**
 * Parser for `log -w` (`cli.log.w`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseW(text: string): RawCommandOutput {
  return parseRawText(text);
}
