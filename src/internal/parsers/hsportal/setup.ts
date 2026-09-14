/**
 * Parser for `hsportal setup` (`cli.hsportal.setup`, rawLine 11395).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSetup(text: string): RawCommandOutput {
  return parseRawText(text);
}
