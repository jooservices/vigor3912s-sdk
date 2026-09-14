/**
 * Parser for `msubnet primWINS` (`cli.msubnet.primwins`, rawLine 5265).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePrimwins(text: string): RawCommandOutput {
  return parseRawText(text);
}
