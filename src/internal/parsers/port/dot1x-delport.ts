/**
 * Parser for `port 802.1x delport` (`cli.port.8021x.delport`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseDot1xDelport(text: string): RawCommandOutput {
  return parseRawText(text);
}
