/**
 * Parser for `apm profile del` (`cli.apm.profile.del`, rawLine 12044).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseProfileDel(text: string): RawCommandOutput {
  return parseRawText(text);
}
