/**
 * Parser for `vpn fromlan add` (`cli.vpn.fromlan.add`, rawLine 10736).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFromlanAdd(text: string): RawCommandOutput {
  return parseRawText(text);
}
