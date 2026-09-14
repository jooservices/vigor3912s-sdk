/**
 * Parser for `vigbrg set` (`cli.vigbrg.set`, rawLine 9249).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
