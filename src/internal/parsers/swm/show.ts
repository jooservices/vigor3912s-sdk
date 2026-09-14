/**
 * Parser for `swm show` (`cli.swm.show`, rawLine 12428).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
