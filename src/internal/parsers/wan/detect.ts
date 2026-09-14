/**
 * Parser for `wan detect` (`cli.wan.detect`, rawLine 10921).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDetect(text: string): RawCommandOutput {
  return parseRawText(text);
}
