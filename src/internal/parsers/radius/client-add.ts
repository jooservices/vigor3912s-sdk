/**
 * Parser for `radius client add` (`cli.radius.client.add`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseClientAdd(text: string): RawCommandOutput {
  return parseRawText(text);
}
