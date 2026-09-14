/**
 * Parser for `wan lbel status`.
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed raw text (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseLbelStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
