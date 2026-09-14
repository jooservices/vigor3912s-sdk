/**
 * Parser for `apm profile reset` (`cli.apm.profile.reset`, rawLine 12044).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseProfileReset(text: string): RawCommandOutput {
  return parseRawText(text);
}
