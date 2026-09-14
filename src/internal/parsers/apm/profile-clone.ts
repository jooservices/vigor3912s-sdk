/**
 * Parser for `apm profile clone` (`cli.apm.profile.clone`, rawLine 12044).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseProfileClone(text: string): RawCommandOutput {
  return parseRawText(text);
}
