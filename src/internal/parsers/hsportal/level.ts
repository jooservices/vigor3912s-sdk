/**
 * Parser for `hsportal level` (`cli.hsportal.level`, rawLine 11494).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLevel(text: string): RawCommandOutput {
  return parseRawText(text);
}
