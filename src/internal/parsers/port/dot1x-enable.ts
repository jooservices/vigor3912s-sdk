/**
 * Parser for `port 802.1x enable` (`cli.port.8021x.enable`, rawLine 6349).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseDot1xEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
