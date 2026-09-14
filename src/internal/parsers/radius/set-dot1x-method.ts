/**
 * Parser for `radius set_dot1x_method` (`cli.radius.setdot1xmethod`, rawLine 11570).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export type { RawCommandOutput };

export function parseSetDot1xMethod(text: string): RawCommandOutput {
  return parseRawText(text);
}
