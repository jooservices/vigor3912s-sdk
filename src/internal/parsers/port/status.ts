/**
 * Parser for `port status` (`cli.port.status`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
