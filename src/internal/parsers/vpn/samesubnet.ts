/**
 * Parser for `vpn sameSubnet` (`cli.vpn.samesubnet`, rawLine 10608).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSameSubnet(text: string): RawCommandOutput {
  return parseRawText(text);
}
