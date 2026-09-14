/**
 * Parser for `radius external -v` (`cli.radius.external.viewprofile`, rawLine 11632).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseExternalViewProfile(text: string): RawCommandOutput {
  return parseRawText(text);
}
