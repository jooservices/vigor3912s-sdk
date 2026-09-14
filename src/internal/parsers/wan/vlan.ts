/**
 * Parser for `wan vlan` (`cli.wan.vlan`, rawLine 11191 -- the indented
 * heading the manifest generator's census test specifically checks for).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseVlan(text: string): RawCommandOutput {
  return parseRawText(text);
}
