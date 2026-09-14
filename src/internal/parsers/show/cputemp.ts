/**
 * Parser for `show cputemp` (`cli.show.cputemp`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowCputemp(text: string): RawCommandOutput {
  return parseRawText(text);
}
