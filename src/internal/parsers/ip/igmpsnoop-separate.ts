/**
 * Parser for `ip igmp_snoop separate` (`cli.ip.igmpsnoop.separate`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopSeparate(text: string): RawCommandOutput {
  return parseRawText(text);
}
