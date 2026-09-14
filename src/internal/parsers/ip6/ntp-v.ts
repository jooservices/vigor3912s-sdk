/**
 * Parser for `ip6 ntp -v` (`cli.ip6.ntp.v`, rawLine 2915).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNtpV(text: string): RawCommandOutput {
  return parseRawText(text);
}
