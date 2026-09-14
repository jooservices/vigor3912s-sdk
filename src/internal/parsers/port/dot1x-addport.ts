/**
 * Parser for `port 802.1x addport` (`cli.port.8021x.addport`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseDot1xAddport(text: string): RawCommandOutput {
  return parseRawText(text);
}
