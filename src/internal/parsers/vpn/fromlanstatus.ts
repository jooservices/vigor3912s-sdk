/**
 * Parser for `vpn fromlan status` (`cli.vpn.fromlan.status`, rawLine 10736).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFromlanStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
