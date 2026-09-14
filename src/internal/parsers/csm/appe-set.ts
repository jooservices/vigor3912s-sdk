/**
 * Parser for `csm appe set` (`cli.csm.appe.set`, rawLine 54).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseAppeSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
