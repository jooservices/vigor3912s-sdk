/**
 * Parser for `linux ring send`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseRingSend(text: string): LinuxAck {
  return parseLinuxAck(text);
}
