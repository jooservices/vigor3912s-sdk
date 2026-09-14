/**
 * Parser for `radius enable_dot1x` (`cli.radius.enabledot1x`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseEnableDot1x(text: string): RawCommandOutput {
  return parseRawText(text);
}
