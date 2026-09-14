/**
 * Parser for `srv nat view` (`cli.srv.nat.view`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseNatView(text: string): RawCommandOutput {
  return parseRawText(text);
}
