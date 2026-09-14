/**
 * Parser for `vpn ovpn` (`cli.vpn.ovpn`, rawLine 10651).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOvpn(text: string): RawCommandOutput {
  return parseRawText(text);
}
