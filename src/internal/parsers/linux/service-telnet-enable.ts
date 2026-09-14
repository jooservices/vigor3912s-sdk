/**
 * Parser for `linux service telnet enable`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseServiceTelnetEnable(text: string): LinuxAck {
  return parseLinuxAck(text);
}
