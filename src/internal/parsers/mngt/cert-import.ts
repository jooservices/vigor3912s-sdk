/**
 * Parser for `mngt cert_import`.
 *
 * Pure, no I/O. No structured response shape is documented for the modelled
 * form -- reduce to trimmed acknowledgement text (YAGNI).
 */

import { parseMngtAck, type MngtAck } from "./ack.js";

export function parseCertImport(text: string): MngtAck {
  return parseMngtAck(text);
}
