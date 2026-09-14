/**
 * Parser for `vpn fromlan enable` (`cli.vpn.fromlan.enable`, rawLine 10736).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFromlanEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
