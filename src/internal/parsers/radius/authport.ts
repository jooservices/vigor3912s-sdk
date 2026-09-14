/**
 * Parser for `radius authport` (`cli.radius.authport`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseAuthport(text: string): RawCommandOutput {
  return parseRawText(text);
}
