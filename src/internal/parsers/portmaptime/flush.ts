/**
 * Parser for `portmaptime -f` (`cli.portmaptime.f`, rawLine 6417).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseFlush(text: string): RawCommandOutput {
  return parseRawText(text);
}
