/**
 * Parser for `msubnet gateway` (`cli.msubnet.gateway`, rawLine 4883).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseGateway(text: string): RawCommandOutput {
  return parseRawText(text);
}
