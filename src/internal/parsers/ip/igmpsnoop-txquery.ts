/**
 * Parser for `ip igmp_snoop txquery` (`cli.ip.igmpsnoop.txquery`, rawLine 1398).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIgmpSnoopTxquery(text: string): RawCommandOutput {
  return parseRawText(text);
}
