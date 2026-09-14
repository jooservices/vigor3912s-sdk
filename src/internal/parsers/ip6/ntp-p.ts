/**
 * Parser for `ip6 ntp -p` (`cli.ip6.ntp.p`, rawLine 2915).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNtpP(text: string): RawCommandOutput {
  return parseRawText(text);
}
