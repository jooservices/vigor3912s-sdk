/**
 * Parser for `ip6 radvd` (`cli.ip6.radvd`, rawLine 2772).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRadvd(text: string): RawCommandOutput {
  return parseRawText(text);
}
