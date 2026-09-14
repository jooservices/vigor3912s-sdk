/**
 * Parser for `upnp off` (`cli.upnp.off`, rawLine 9014).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUpnpOff(text: string): RawCommandOutput {
  return parseRawText(text);
}
