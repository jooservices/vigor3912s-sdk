/**
 * Parser for `port 802.1x status` (`cli.port.8021x.status`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseDot1xStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
