/**
 * Parser for `ip igmp_snoop status` (`cli.ip.igmpsnoop.status`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
