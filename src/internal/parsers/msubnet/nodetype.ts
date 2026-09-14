/**
 * Parser for `msubnet nodetype` (`cli.msubnet.nodetype`, rawLine 5196).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNodetype(text: string): RawCommandOutput {
  return parseRawText(text);
}
