/**
 * Parser for `wan failover` (`cli.wan.failover`, rawLine 11335).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFailover(text: string): RawCommandOutput {
  return parseRawText(text);
}
