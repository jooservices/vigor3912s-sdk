/**
 * Parser for `mngt ip6_IIDs`.
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed acknowledgement text (YAGNI).
 */

import { parseMngtAck, type MngtAck } from "./ack.js";

export function parseIp6Iids(text: string): MngtAck {
  return parseMngtAck(text);
}
