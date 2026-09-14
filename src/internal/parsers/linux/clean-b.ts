/**
 * Parser for `linux clean -b` (`cli.linux.clean.b`, rawLine 12969: "-b -
 * clean backuped firmware and configuration").
 */

import { parseLinuxAck, type LinuxAck } from "./shared.js";

export function parseCleanB(text: string): LinuxAck {
  return parseLinuxAck(text);
}
