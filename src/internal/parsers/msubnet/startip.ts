/**
 * Parser for `msubnet startip` (`cli.msubnet.startip`, rawLine 5024).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseStartip(text: string): RawCommandOutput {
  return parseRawText(text);
}
