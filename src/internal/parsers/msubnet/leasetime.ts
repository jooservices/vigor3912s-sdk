/**
 * Parser for `msubnet leasetime` (`cli.msubnet.leasetime`, rawLine 5535).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLeasetime(text: string): RawCommandOutput {
  return parseRawText(text);
}
