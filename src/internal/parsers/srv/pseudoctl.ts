/**
 * Parser for `srv nat pseudoctl` (`cli.srv.nat.pseudoctl`, rawLine 7646).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePseudoctl(text: string): RawCommandOutput {
  return parseRawText(text);
}
