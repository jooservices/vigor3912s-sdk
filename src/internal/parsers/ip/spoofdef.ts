/**
 * Parser for `ip spoofdef` (`cli.ip.spoofdef`, rawLine 2030).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSpoofdef(text: string): RawCommandOutput {
  return parseRawText(text);
}
