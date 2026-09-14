/**
 * Parser for `ip dnsforward` (`cli.ip.dnsforward`, rawLine 1990) -- sibling-
 * live-verified bare/query form.
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDnsForward(text: string): RawCommandOutput {
  return parseRawText(text);
}
