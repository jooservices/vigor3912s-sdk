/**
 * Parser for `sys app_bandwidth` (`cli.sys.appbandwidth`, live-firmware-recon).
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed acknowledgement text (YAGNI).
 */

import { parseSysAck, type SysAck } from "./ack.js";

export function parseSysAppBandwidth(text: string): SysAck {
  return parseSysAck(text);
}
