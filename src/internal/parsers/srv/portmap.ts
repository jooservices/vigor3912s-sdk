/**
 * Parser for `srv nat portmap` (`cli.srv.nat.portmap`, rawLine 7474).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePortmap(text: string): RawCommandOutput {
  return parseRawText(text);
}
