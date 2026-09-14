/**
 * Parser for `apm query` (`cli.apm.query`, rawLine 12017).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseQuery(text: string): RawCommandOutput {
  return parseRawText(text);
}
