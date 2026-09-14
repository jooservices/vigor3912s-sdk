/**
 * Parser for `portmaptime -l` (`cli.portmaptime.l`, rawLine 6417).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseList(text: string): RawCommandOutput {
  return parseRawText(text);
}
