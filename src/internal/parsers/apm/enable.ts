/**
 * Parser for `apm enable` (`cli.apm.enable`, rawLine 12017).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
