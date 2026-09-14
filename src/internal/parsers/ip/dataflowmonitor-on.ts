/**
 * Parser for `ip dataflowmonitor on` (`cli.ip.dataflowmonitor.on`, rawLine 1539).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDataflowmonitorOn(text: string): RawCommandOutput {
  return parseRawText(text);
}
