/**
 * Parser for `radius external` configure flags (`cli.radius.external`, rawLine 11632).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseExternal(text: string): RawCommandOutput {
  return parseRawText(text);
}
