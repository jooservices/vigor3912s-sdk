/**
 * Parser for `msubnet addr` (`cli.msubnet.addr`, rawLine 4676).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseAddr(text: string): RawCommandOutput {
  return parseRawText(text);
}
