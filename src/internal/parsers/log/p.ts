/**
 * Parser for `log -p` (`cli.log.p`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseP(text: string): RawCommandOutput {
  return parseRawText(text);
}
