/**
 * Parser for `msubnet switch` (`cli.msubnet.switch`, rawLine 4633).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwitch(text: string): RawCommandOutput {
  return parseRawText(text);
}
