/**
 * Parser for `vigbrg wlanstatus` (`cli.vigbrg.wlanstatus`, rawLine 9326) --
 * the documented output shape is identical to `vigbrg wanstatus`'s "Vigor
 * Bridge: <state>" + "WAN mac table" (rawLine 9315), see
 * `internal/parsers/vigbrg/shared.ts`.
 */

import { parseVigbrgMacTable, type VigbrgMacTableReport } from "./shared.js";

export function parseWlanStatus(text: string): VigbrgMacTableReport {
  return parseVigbrgMacTable(text);
}
