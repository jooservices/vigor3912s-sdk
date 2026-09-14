/**
 * Parser for `hsportal info` (`cli.hsportal.info`, rawLine 11458).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseInfo(text: string): RawCommandOutput {
  return parseRawText(text);
}
