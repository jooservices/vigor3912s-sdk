/**
 * Parser for `testmail` (`cli.testmail`, rawLine 9000).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSend(text: string): RawCommandOutput {
  return parseRawText(text);
}
