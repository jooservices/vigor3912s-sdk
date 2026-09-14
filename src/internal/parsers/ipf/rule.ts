/**
 * Parser for `ipf rule` (`cli.ipf.rule`, rawLine 3600).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRule(text: string): RawCommandOutput {
  return parseRawText(text);
}
