/**
 * Parser for `swm post` (`cli.swm.post`, rawLine 12503).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmPost(text: string): RawCommandOutput {
  return parseRawText(text);
}
