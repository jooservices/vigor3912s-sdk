/**
 * Parser for `radius show` (`cli.radius.show`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseShow(text: string): RawCommandOutput {
  return parseRawText(text);
}
