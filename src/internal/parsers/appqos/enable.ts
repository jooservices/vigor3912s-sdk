/**
 * Parser for `appqos enable` (`cli.appqos.enable`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
