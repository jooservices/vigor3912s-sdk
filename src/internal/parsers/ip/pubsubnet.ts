/**
 * Parser for `ip pubsubnet` (`cli.ip.pubsubnet`, rawLine 984).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parsePubsubnet(text: string): RawCommandOutput {
  return parseRawText(text);
}
