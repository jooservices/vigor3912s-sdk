/**
 * Parser for `port sniff status` (`cli.port.sniff.status`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSniffStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
