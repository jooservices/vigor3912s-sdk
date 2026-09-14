/**
 * Parser for `port 802.1x disable` (`cli.port.8021x.disable`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseDot1xDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
