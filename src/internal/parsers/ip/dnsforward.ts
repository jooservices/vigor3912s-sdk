/**
 * Parser for `ip dnsforward -i <index> -l` (`cli.ip.dnsforward`, rawLine 1990),
 * the documented read-only profile-list form.
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDnsForward(text: string): RawCommandOutput {
  return parseRawText(text);
}
