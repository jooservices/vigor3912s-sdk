/**
 * Parser for `qos setup` (`cli.qos.setup`, rawLine 6452).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseQosSetup(text: string): RawCommandOutput {
  return parseRawText(text);
}
