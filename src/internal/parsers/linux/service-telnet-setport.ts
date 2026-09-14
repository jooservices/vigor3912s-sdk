/**
 * Parser for `linux service telnet setport`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseServiceTelnetSetport(text: string): LinuxAck {
  return parseLinuxAck(text);
}
