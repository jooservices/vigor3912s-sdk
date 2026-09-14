/**
 * Parser for `msubnet talk` (`cli.msubnet.talk`, rawLine 4963).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTalk(text: string): RawCommandOutput {
  return parseRawText(text);
}
