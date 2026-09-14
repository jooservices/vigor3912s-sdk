/**
 * Parser for `linux clean -d` (`cli.linux.clean.d`, rawLine 12969: "-d -
 * clean local data partion").
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseCleanD(text: string): LinuxAck {
  return parseLinuxAck(text);
}
