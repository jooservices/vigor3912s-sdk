/**
 * Parser for `portmaptime -t/-u/-i/-w/-s` (`cli.portmaptime`, rawLine 6417).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
