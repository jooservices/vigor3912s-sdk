/**
 * Parser for `linux syslog disable` (`cli.linux.syslog.disable`,
 * rawLine 12969).
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseSyslogDisable(text: string): LinuxAck {
  return parseLinuxAck(text);
}
