/**
 * Parser for `apm discover` (`cli.apm.discover`, rawLine 12017).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDiscover(text: string): RawCommandOutput {
  return parseRawText(text);
}
