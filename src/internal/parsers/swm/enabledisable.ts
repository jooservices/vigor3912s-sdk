/**
 * Parser for `swm enable` / `swm disable` (`cli.swm.enable.disable`,
 * rawLine 12517).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmEnableDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
