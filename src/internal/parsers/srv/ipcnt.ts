/**
 * Parser for `srv dhcp ipcnt` (`cli.srv.dhcp.ipcnt`, rawLine 7122).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIpcnt(text: string): RawCommandOutput {
  return parseRawText(text);
}
