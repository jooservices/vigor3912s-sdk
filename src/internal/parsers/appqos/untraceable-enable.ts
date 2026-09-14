/**
 * Parser for `appqos untraceable -e` (`cli.appqos.untraceable.e`, rawLine 11958).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseUntraceableEnable(text: string): RawCommandOutput {
  return parseRawText(text);
}
