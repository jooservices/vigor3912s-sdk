/**
 * Parser for `srv nat dmz` (`cli.srv.nat.dmz`, rawLine 7347).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDmz(text: string): RawCommandOutput {
  return parseRawText(text);
}
