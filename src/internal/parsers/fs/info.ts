/**
 * Parser for `fs info` (`cli.fs.info`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseFsInfo(text: string): RawCommandOutput {
  return parseRawText(text);
}
