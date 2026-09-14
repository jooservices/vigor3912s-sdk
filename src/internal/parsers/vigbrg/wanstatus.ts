/**
 * Parser for `vigbrg wanstatus` (`cli.vigbrg.wanstatus`, rawLine 9315).
 */

import { parseVigbrgMacTable, type VigbrgMacTableReport } from "./shared.js";

export function parseWanStatus(text: string): VigbrgMacTableReport {
  return parseVigbrgMacTable(text);
}
