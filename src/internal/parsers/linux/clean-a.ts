/**
 * Parser for `linux clean -a` (`cli.linux.clean.a`, rawLine 12969: "-a -
 * clean local app partion").
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseCleanA(text: string): LinuxAck {
  return parseLinuxAck(text);
}
