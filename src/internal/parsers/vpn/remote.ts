/**
 * Parser for `vpn remote` (`cli.vpn.remote`, rawLine 10208).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseRemote(text: string): RawCommandOutput {
  return parseRawText(text);
}
