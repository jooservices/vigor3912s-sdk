/**
 * Parser for `vpn mfa` (`cli.vpn.mfa`, rawLine 10765).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMfa(text: string): RawCommandOutput {
  return parseRawText(text);
}
