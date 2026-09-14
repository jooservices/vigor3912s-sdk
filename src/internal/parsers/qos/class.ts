/**
 * Parser for `qos class` (`cli.qos.class`, rawLine 6515).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseQosClass(text: string): RawCommandOutput {
  return parseRawText(text);
}
