/**
 * Parser for `radius enable` (`cli.radius.enable`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
