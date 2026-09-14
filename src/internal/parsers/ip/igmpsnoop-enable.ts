/**
 * Parser for `ip igmp_snoop enable` (`cli.ip.igmpsnoop.enable`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
