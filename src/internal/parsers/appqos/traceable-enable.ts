/**
 * Parser for `appqos traceable -e` (`cli.appqos.traceable.e`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseTraceableEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
