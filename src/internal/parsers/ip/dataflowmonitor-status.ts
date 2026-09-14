/**
 * Parser for `ip dataflowmonitor status` (`cli.ip.dataflowmonitor.status`, rawLine 1539).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDataflowmonitorStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
