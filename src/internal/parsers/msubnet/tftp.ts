/**
 * Parser for `msubnet tftp` (`cli.msubnet.tftp`, rawLine 5439).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTftp(text: string): RawCommandOutput {
  return parseRawText(text);
}
