/**
 * Parser for `msubnet pppip` (`cli.msubnet.pppip`, rawLine 5112).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePppip(text: string): RawCommandOutput {
  return parseRawText(text);
}
