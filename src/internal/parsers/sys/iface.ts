/**
 * Parser for `sys iface`.
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed acknowledgement text (YAGNI).
 */

import { parseSysAck, type SysAck } from "./ack.js";

export function parseIface(text: string): SysAck {
  return parseSysAck(text);
}
