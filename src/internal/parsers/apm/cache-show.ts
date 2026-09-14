/**
 * Parser for `apm cache show` (`cli.apm.cache.show`, rawLine 12100).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseCacheShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
