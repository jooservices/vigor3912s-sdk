/**
 * Parser for `ip session` (`cli.ip.session`, rawLine 1442).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSession(text: string): RawCommandOutput {
  return parseRawText(text);
}
