/**
 * Parser for `srv dhcp public status` (`cli.srv.dhcp.public.status`, rawLine 7023).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePublicStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
