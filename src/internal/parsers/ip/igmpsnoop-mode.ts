/**
 * Parser for `ip igmp_snoop mode` (`cli.ip.igmpsnoop.mode`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopMode(text: string): RawCommandOutput {
  return parseRawText(text);
}
