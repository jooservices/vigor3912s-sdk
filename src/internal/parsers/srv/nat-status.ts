/**
 * Parser for `srv nat status` (`cli.srv.nat.status`, rawLine 7588).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNatStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
