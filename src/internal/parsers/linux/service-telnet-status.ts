/**
 * Parser for `linux service telnet status`.
 */

import { parseLinuxToggleStatus, type LinuxToggleStatus } from "./shared.js";

export function parseServiceTelnetStatus(text: string): LinuxToggleStatus {
  return parseLinuxToggleStatus(text);
}
