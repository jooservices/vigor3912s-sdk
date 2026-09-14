/**
 * Parser for `ldap user` (`cli.ldap.user`, rawLine 4033).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUser(text: string): RawCommandOutput {
  return parseRawText(text);
}
