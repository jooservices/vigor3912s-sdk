/**
 * Parser for `linux setlinuxip` (`cli.linux.setlinuxip`, rawLine 12969).
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseSetLinuxIp(text: string): LinuxAck {
  return parseLinuxAck(text);
}
