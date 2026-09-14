/**
 * Parser for `switch off` (`cli.switch.off`, rawLine 7740).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOff(text: string): RawCommandOutput {
  return parseRawText(text);
}
