/**
 * Parser for `swm snmp` (`cli.swm.snmp`, rawLine 12929).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseSwmSnmp(text: string): RawCommandOutput {
  return parseRawText(text);
}
