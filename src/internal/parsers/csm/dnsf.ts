/**
 * Parser for `csm dnsf` (`cli.csm.dnsf`, rawLine 520).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDnsf(text: string): RawCommandOutput {
  return parseRawText(text);
}
