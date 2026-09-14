/**
 * Parser for `wan multifno status`.
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed raw text (YAGNI).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseMultifnoStatus(text: string): RawCommandOutput {
  return parseRawText(text);
}
