/**
 * Parser for `log -t` (`cli.log.t`, rawLine 3984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseT(text: string): RawCommandOutput {
  return parseRawText(text);
}
