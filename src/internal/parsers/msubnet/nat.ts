/**
 * Parser for `msubnet nat` (`cli.msubnet.nat`, rawLine 4837).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNat(text: string): RawCommandOutput {
  return parseRawText(text);
}
