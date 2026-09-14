/**
 * Parser for `ip wanrip` (`cli.ip.wanrip`, rawLine 1273).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseWanrip(text: string): RawCommandOutput {
  return parseRawText(text);
}
