/**
 * Parser for `linux ring test`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseRingTest(text: string): LinuxAck {
  return parseLinuxAck(text);
}
