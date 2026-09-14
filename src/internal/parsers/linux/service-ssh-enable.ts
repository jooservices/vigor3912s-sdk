/**
 * Parser for `linux service ssh enable` (`cli.linux.service.ssh.enable`,
 * rawLine 12969).
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseServiceSshEnable(text: string): LinuxAck {
  return parseLinuxAck(text);
}
