/**
 * Parser for `srv nat trigger` (`cli.srv.nat.trigger`, rawLine 7535).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseTrigger(text: string): RawCommandOutput {
  return parseRawText(text);
}
