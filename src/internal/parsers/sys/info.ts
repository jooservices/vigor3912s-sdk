/**
 * Parser for `sys info` (`cli.sys.info`, live-firmware-recon).
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed acknowledgement text (YAGNI).
 */

import { parseSysAck, type SysAck } from "./ack.js";

export function parseSysInfo(text: string): SysAck {
  return parseSysAck(text);
}
