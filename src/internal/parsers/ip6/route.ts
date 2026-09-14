/**
 * Parser for `ip6 route` (`cli.ip6.route`, rawLine 2635).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRoute(text: string): RawCommandOutput {
  return parseRawText(text);
}
