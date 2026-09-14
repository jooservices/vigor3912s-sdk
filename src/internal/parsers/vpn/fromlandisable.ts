/**
 * Parser for `vpn fromlan disable` (`cli.vpn.fromlan.disable`, rawLine 10736).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFromlanDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
