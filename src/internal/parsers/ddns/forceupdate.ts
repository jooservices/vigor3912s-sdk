/**
 * Parser for `ddns forceupdate` (`cli.ddns.forceupdate`, rawLine 773).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseForceUpdate(text: string): RawCommandOutput {
  return parseRawText(text);
}
