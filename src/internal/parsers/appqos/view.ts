/**
 * Parser for `appqos view` (`cli.appqos.view`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseView(text: string): RawCommandOutput {
  return parseRawText(text);
}
