/**
 * Parser for `ip igmp_snoop chkleave` (`cli.ip.igmpsnoop.chkleave`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopChkleave(text: string): RawCommandOutput {
  return parseRawText(text);
}
