/**
 * Parser for `ip route` (`cli.ip.route`, rawLine 1310).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRoute(text: string): RawCommandOutput {
  return parseRawText(text);
}
