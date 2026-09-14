/**
 * Parser for `ip dataflowmonitor off` (`cli.ip.dataflowmonitor.off`, rawLine 1539).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDataflowmonitorOff(text: string): RawCommandOutput {
  return parseRawText(text);
}
