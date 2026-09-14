/**
 * Parser for `linux service telnet disable`.
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseServiceTelnetDisable(text: string): LinuxAck {
  return parseLinuxAck(text);
}
