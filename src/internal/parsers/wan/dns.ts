/**
 * Parser for `wan dns` (`cli.wan.dns`, rawLine 10824).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDns(text: string): RawCommandOutput {
  return parseRawText(text);
}
