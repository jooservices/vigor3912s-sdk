/**
 * Parser for `ip igmp_snoop acceptlist` (`cli.ip.igmpsnoop.acceptlist`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopAcceptlist(text: string): RawCommandOutput {
  return parseRawText(text);
}
