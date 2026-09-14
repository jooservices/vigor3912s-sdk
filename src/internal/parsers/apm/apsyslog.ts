/**
 * Parser for `apm apsyslog` (`cli.apm.apsyslog`, rawLine 12204).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseApsyslog(text: string): RawCommandOutput {
  return parseRawText(text);
}
