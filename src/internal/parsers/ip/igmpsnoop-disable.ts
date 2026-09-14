/**
 * Parser for `ip igmp_snoop disable` (`cli.ip.igmpsnoop.disable`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
