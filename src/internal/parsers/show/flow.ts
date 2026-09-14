/**
 * Parser for `show flow` (`cli.show.flow`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowFlow(text: string): RawCommandOutput {
  return parseRawText(text);
}
