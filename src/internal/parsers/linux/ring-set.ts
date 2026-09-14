/**
 * Parser for `linux ring set`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseRingSet(text: string): LinuxAck {
  return parseLinuxAck(text);
}
