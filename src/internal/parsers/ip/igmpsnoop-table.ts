/**
 * Parser for `ip igmp_snoop table` (`cli.ip.igmpsnoop.table`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopTable(text: string): RawCommandOutput {
  return parseRawText(text);
}
