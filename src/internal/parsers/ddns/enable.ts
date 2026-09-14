/**
 * Parser for `ddns enable` (`cli.ddns.enable`, rawLine 627).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
