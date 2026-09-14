/**
 * Parser for `ip dhcpc` (`cli.ip.dhcpc`, rawLine 1145).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcpc(text: string): RawCommandOutput {
  return parseRawText(text);
}
