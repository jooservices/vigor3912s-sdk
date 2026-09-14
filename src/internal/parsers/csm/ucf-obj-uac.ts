/**
 * Parser for `csm ucf obj INDEX uac` (`cli.csm.ucf.obj.index.uac`, rawLine 245).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUcfObjUac(text: string): RawCommandOutput {
  return parseRawText(text);
}
