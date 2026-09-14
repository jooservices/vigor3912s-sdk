/**
 * Parser for `appqos untraceable -v` (`cli.appqos.untraceable.v`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseUntraceableView(text: string): RawCommandOutput {
  return parseRawText(text);
}
