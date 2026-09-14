/**
 * Parser for `wan enable` (`cli.wan.enable`, rawLine 10868).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
