/**
 * Parser for `ip policy_rt` (`cli.ip.policyrt`, rawLine 1793).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePolicyRt(text: string): RawCommandOutput {
  return parseRawText(text);
}
