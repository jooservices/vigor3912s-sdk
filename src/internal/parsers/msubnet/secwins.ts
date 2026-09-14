/**
 * Parser for `msubnet secWINS` (`cli.msubnet.secwins`, rawLine 5367).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSecwins(text: string): RawCommandOutput {
  return parseRawText(text);
}
