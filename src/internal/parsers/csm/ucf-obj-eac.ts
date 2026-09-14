/**
 * Parser for `csm ucf obj INDEX eac` (`cli.csm.ucf.obj.index.eac`, rawLine 304).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUcfObjEac(text: string): RawCommandOutput {
  return parseRawText(text);
}
