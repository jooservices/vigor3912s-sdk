/**
 * Parser for `service -s` (`cli.service`, rawLine 13038).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
