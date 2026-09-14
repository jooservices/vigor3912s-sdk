/**
 * Parser for `upnp on` (`cli.upnp.on`, rawLine 9020).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseUpnpOn(text: string): RawCommandOutput {
  return parseRawText(text);
}
