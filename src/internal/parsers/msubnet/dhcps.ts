/**
 * Parser for `msubnet dhcps` (`cli.msubnet.dhcps`, rawLine 4797).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseDhcps(text: string): RawCommandOutput {
  return parseRawText(text);
}
