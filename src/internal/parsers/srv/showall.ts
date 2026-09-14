/**
 * Parser for `srv nat showall` (`cli.srv.nat.showall`, rawLine 7619).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowall(text: string): RawCommandOutput {
  return parseRawText(text);
}
