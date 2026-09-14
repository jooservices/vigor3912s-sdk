/**
 * Parser for `linux ring clean`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseRingClean(text: string): LinuxAck {
  return parseLinuxAck(text);
}
