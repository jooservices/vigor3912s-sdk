/**
 * Parser for `apm show` (`cli.apm.show`, rawLine 12017).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
