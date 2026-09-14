/**
 * Parser for `csm ucf obj INDEX wf` (`cli.csm.ucf.obj.index.wf`, rawLine 342).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUcfObjWf(text: string): RawCommandOutput {
  return parseRawText(text);
}
