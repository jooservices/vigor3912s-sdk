/**
 * Parser for `port <port> <speed>` (`cli.port`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSpeed(text: string): RawCommandOutput {
  return parseRawText(text);
}
