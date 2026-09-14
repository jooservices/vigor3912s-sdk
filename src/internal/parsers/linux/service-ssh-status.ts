/**
 * Parser for `linux service ssh status` (`cli.linux.service.ssh.status`,
 * rawLine 12969: "<status> - Display the current setting status for the
 * service based on the protocol of Telnet/SSH.").
 */

import { parseLinuxToggleStatus, type LinuxToggleStatus } from "./shared.js";

export function parseServiceSshStatus(text: string): LinuxToggleStatus {
  return parseLinuxToggleStatus(text);
}
