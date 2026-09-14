/**
 * Parser for `linux syslog status` (`cli.linux.syslog.status`,
 * rawLine 12969).
 */

import { parseLinuxToggleStatus, type LinuxToggleStatus } from "./shared.js";

export function parseSyslogStatus(text: string): LinuxToggleStatus {
  return parseLinuxToggleStatus(text);
}
