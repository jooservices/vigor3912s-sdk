/**
 * Parser for `ip igmp_snoop portchk` (`cli.ip.igmpsnoop.portchk`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopPortchk(text: string): RawCommandOutput {
  return parseRawText(text);
}
