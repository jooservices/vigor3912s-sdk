/**
 * Parser for `apm profile apply` (`cli.apm.profile.apply`, rawLine 12044).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseProfileApply(text: string): RawCommandOutput {
  return parseRawText(text);
}
