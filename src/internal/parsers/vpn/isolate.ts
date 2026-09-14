/**
 * Parser for `vpn isolate` (`cli.vpn.isolate`, rawLine 10754).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIsolate(text: string): RawCommandOutput {
  return parseRawText(text);
}
