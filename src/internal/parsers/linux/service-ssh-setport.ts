/**
 * Parser for `linux service ssh setport` (`cli.linux.service.ssh.setport`,
 * rawLine 12969).
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseServiceSshSetport(text: string): LinuxAck {
  return parseLinuxAck(text);
}
