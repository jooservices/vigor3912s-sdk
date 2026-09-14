/**
 * Parser for `msubnet nmask` (`cli.msubnet.nmask`, rawLine 4718).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNmask(text: string): RawCommandOutput {
  return parseRawText(text);
}
