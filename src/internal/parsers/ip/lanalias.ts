/**
 * Parser for `ip lanalias` (`cli.ip.lanalias`, rawLine 1035).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLanAlias(text: string): RawCommandOutput {
  return parseRawText(text);
}
