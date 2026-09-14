/**
 * Parser for `radius client del` (`cli.radius.client.del`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseClientDel(text: string): RawCommandOutput {
  return parseRawText(text);
}
