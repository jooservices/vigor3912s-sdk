/**
 * Parser for `msubnet ipcnt` (`cli.msubnet.ipcnt`, rawLine 4925).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIpcnt(text: string): RawCommandOutput {
  return parseRawText(text);
}
