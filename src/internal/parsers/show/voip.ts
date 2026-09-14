/**
 * Parser for `show voip` (`cli.show.voip`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowVoip(text: string): RawCommandOutput {
  return parseRawText(text);
}
