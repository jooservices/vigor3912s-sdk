/**
 * Parser for `ip maxnatuser` (`cli.ip.maxnatuser`, rawLine 1781).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMaxnatuser(text: string): RawCommandOutput {
  return parseRawText(text);
}
