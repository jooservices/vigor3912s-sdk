/**
 * Parser for the `user set` / `user edit` / `user account` / `user
 * setdefault` sub-forms (`cli.user`, rawLine 11800).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseManage(text: string): RawCommandOutput {
  return parseRawText(text);
}
