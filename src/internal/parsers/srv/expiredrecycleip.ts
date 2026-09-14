/**
 * Parser for `srv dhcp expRecycleIP` (`cli.srv.dhcp.expiredrecycleip`, rawLine 7261).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseExpiredrecycleip(text: string): RawCommandOutput {
  return parseRawText(text);
}
