/**
 * Parser for `wan mtu` / `wan mtu2` (`cli.wan.mtu.mtu2`, rawLine 10804).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMtu(text: string): RawCommandOutput {
  return parseRawText(text);
}
