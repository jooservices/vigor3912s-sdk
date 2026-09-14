/**
 * Parser for `srv nat openport` (`cli.srv.nat.openport`, rawLine 7410).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOpenport(text: string): RawCommandOutput {
  return parseRawText(text);
}
