/**
 * Parser for `vpn graph` (`cli.vpn.graph`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseGraph(text: string): RawCommandOutput {
  return parseRawText(text);
}
