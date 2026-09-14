/**
 * Parser for `sys ftpd`.
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed acknowledgement text (YAGNI).
 */

import { parseSysAck, type SysAck } from "./ack.js";

export function parseFtpd(text: string): SysAck {
  return parseSysAck(text);
}
