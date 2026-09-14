/**
 * Parser for `apm syslog` (`cli.apm.syslog`, rawLine 12226).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSyslog(text: string): RawCommandOutput {
  return parseRawText(text);
}
