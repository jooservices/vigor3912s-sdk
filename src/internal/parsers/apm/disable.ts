/**
 * Parser for `apm disable` (`cli.apm.disable`, rawLine 12017).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
