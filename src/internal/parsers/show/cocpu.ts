/**
 * Parser for `show cocpu` (`cli.show.cocpu`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowCocpu(text: string): RawCommandOutput {
  return parseRawText(text);
}
