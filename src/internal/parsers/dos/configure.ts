/**
 * Parser for remaining `dos` configure flags (`cli.dos`, rawLine 812).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseConfigure(text: string): RawCommandOutput {
  return parseRawText(text);
}
