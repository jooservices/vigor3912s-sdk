/**
 * Parser for `internet -V` (`cli.internet.v`, rawLine 908).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseView(text: string): RawCommandOutput {
  return parseRawText(text);
}
