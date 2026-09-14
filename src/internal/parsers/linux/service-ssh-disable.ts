/**
 * Parser for `linux service ssh disable` (`cli.linux.service.ssh.disable`,
 * rawLine 12969).
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseServiceSshDisable(text: string): LinuxAck {
  return parseLinuxAck(text);
}
