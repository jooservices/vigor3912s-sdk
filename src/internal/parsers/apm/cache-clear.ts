/**
 * Parser for `apm cache clear` (`cli.apm.cache.clear`, rawLine 12100).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseCacheClear(text: string): RawCommandOutput {
  return parseRawText(text);
}
