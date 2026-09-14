/**
 * Parser for `srv nat ipsecpass` (`cli.srv.nat.ipsecpass`, rawLine 7390).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseIpsecpass(text: string): RawCommandOutput {
  return parseRawText(text);
}
