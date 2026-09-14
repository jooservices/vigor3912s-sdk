/**
 * Parser for `srv dhcp gateway` (`cli.srv.dhcp.gateway`, rawLine 7108).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseGateway(text: string): RawCommandOutput {
  return parseRawText(text);
}
