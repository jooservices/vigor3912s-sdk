/**
 * Parser for `radius set_auth_method` (`cli.radius.setauthmethod`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSetAuthMethod(text: string): RawCommandOutput {
  return parseRawText(text);
}
