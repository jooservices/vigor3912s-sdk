/**
 * Parser for `radius external -l` (`cli.radius.external.log`, rawLine 11632).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseExternalLog(text: string): RawCommandOutput {
  return parseRawText(text);
}
