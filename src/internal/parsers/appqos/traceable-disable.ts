/**
 * Parser for `appqos traceable -d` (`cli.appqos.traceable.d`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseTraceableDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
