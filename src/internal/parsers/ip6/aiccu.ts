/**
 * Parser for `ip6 aiccu` (`cli.ip6.aiccu`, rawLine 2897).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseAiccu(text: string): RawCommandOutput {
  return parseRawText(text);
}
