/**
 * Parser for `internet -W/-M/...` (`cli.internet`, rawLine 908).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
