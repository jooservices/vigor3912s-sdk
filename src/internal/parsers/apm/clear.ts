/**
 * Parser for `apm clear` (`cli.apm.clear`, rawLine 12017).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseClear(text: string): RawCommandOutput {
  return parseRawText(text);
}
