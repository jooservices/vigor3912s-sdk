/**
 * Parser for `linux syslog enable` (`cli.linux.syslog.enable`,
 * rawLine 12969).
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseSyslogEnable(text: string): LinuxAck {
  return parseLinuxAck(text);
}
