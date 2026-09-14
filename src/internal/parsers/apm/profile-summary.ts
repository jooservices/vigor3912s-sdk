/**
 * Parser for `apm profile summary` (`cli.apm.profile.summary`, rawLine 12044).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseProfileSummary(text: string): RawCommandOutput {
  return parseRawText(text);
}
