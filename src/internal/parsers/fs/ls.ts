/**
 * Parser for `fs ls` (`cli.fs.ls`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFsLs(text: string): RawCommandOutput {
  return parseRawText(text);
}
