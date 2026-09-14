/**
 * Parser for `apm profile show` (`cli.apm.profile.show`, rawLine 12044).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseProfileShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
