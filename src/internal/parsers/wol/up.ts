/**
 * Parser for `wol up <MAC Address>` (`cli.wol`, rawLine 11766).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUp(text: string): RawCommandOutput {
  return parseRawText(text);
}
