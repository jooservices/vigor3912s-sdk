/**
 * Parser for `tacacsplus set` (`cli.tacacsplus.set`, rawLine 4121).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
