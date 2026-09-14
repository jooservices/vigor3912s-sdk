/**
 * Parser for `linux ring debug`.
 *
 * Raw text only -- ring debug has no documented structured shape.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseRingDebug(text: string): LinuxAck {
  return parseLinuxAck(text);
}
