/**
 * Parser for `switch on` (`cli.switch.on`, rawLine 7735).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOn(text: string): RawCommandOutput {
  return parseRawText(text);
}
