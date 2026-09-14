/**
 * Parser for `appqos traceable -v` (`cli.appqos.traceable.v`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseTraceableView(text: string): RawCommandOutput {
  return parseRawText(text);
}
