/**
 * Parser for `srv dhcp public start` (`cli.srv.dhcp.public.start`, rawLine 7023).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePublicStart(text: string): RawCommandOutput {
  return parseRawText(text);
}
