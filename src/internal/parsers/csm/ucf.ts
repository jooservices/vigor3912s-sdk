/**
 * Parser for `csm ucf` (`cli.csm.ucf`, rawLine 188).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUcf(text: string): RawCommandOutput {
  return parseRawText(text);
}
