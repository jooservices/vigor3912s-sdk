/**
 * Parser for `srv dhcp on` (`cli.srv.dhcp.on`, rawLine 7137). Per
 * `command-map.md`'s "LAN / DHCP / NAT" table and `operations.md`'s common
 * writes table, this command "requires `sys reboot`" to take effect -- an
 * operational/runbook note, not a change to this command's own frame or
 * parsed output (`sys reboot` is a separate, out-of-scope-here manifest
 * entry; this family's write scope does not chain commands).
 */

import { parseRawText, type RawCommandOutput } from "./shared.js";

export function parseOn(text: string): RawCommandOutput {
  return parseRawText(text);
}
