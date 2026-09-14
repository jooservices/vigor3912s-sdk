/**
 * Parser for `port sniff ...` (`cli.port.sniff`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSniff(text: string): RawCommandOutput {
  return parseRawText(text);
}
