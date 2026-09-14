/**
 * Parser for `radius external -V` (`cli.radius.external.view`, rawLine 11632).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseExternalView(text: string): RawCommandOutput {
  return parseRawText(text);
}
