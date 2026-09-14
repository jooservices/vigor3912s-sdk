/**
 * Parser for `srv nat RSTTimeout` (`cli.srv.nat.rsttimeout`, rawLine 7668).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRsttimeout(text: string): RawCommandOutput {
  return parseRawText(text);
}
