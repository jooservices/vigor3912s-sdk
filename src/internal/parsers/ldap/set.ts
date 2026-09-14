/**
 * Parser for `ldap set` (`cli.ldap.set`, rawLine 4073).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSet(text: string): RawCommandOutput {
  return parseRawText(text);
}
