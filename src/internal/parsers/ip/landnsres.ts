/**
 * Parser for `ip lanDNSRes` (`cli.ip.landnsres`, rawLine 1938) -- sibling-
 * live-verified bare/query form.
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLanDnsRes(text: string): RawCommandOutput {
  return parseRawText(text);
}
