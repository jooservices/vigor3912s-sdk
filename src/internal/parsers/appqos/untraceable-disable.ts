/**
 * Parser for `appqos untraceable -d` (`cli.appqos.untraceable.d`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseUntraceableDisable(text: string): RawCommandOutput {
  return parseRawText(text);
}
