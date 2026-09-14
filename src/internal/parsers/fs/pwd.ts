/**
 * Parser for `fs pwd` (`cli.fs.pwd`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFsPwd(text: string): RawCommandOutput {
  return parseRawText(text);
}
