/**
 * Parser for `show qryrdsl` (`cli.show.qryrdsl`, live-firmware-recon).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseShowQryrdsl(text: string): RawCommandOutput {
  return parseRawText(text);
}
