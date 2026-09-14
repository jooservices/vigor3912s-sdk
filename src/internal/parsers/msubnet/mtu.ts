/**
 * Parser for `msubnet mtu` (`cli.msubnet.mtu`, rawLine 5496).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMtu(text: string): RawCommandOutput {
  return parseRawText(text);
}
