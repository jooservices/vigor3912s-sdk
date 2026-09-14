/**
 * Parser for `object ip obj INDEX -v` (`cli.object.ip.obj`, rawLine 5578).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ...
 * `(text: string) => TOutput`"). Sample response shape taken verbatim from
 * the documented example at that rawLine:
 *
 * ```
 *  IP Object Profile 1
 *  Name   :[marketing]
 *  Interface:[Any]
 *  Address type:[single]
 *  Start ip address:[192.168.1.45]
 *  End/Mask ip address:[0.0.0.0]
 *  MAC Address:[00:00:00:00:00:00]
 *  Invert Selection:[0]
 * ```
 */

export interface IpObjectProfileReport {
  readonly profileIndex: number | null;
  readonly name: string | null;
  readonly interfaceName: string | null;
  readonly addressType: string | null;
  readonly startIpAddress: string | null;
  readonly endMaskIpAddress: string | null;
  readonly macAddress: string | null;
  readonly invertSelection: string | null;
}

function matchBracketed(text: string, label: string): string | null {
  const pattern = new RegExp(`${label}\\s*:\\s*\\[([^\\]]*)\\]`, "i");
  const match = pattern.exec(text);

  return match?.[1] ?? null;
}

export function parseIpObjView(text: string): IpObjectProfileReport {
  const headingMatch = /IP Object Profile\s+(\d+)/i.exec(text);

  return {
    profileIndex: headingMatch?.[1] === undefined ? null : Number(headingMatch[1]),
    name: matchBracketed(text, "Name"),
    interfaceName: matchBracketed(text, "Interface"),
    addressType: matchBracketed(text, "Address type"),
    startIpAddress: matchBracketed(text, "Start ip address"),
    endMaskIpAddress: matchBracketed(text, "End/Mask ip address"),
    macAddress: matchBracketed(text, "MAC Address"),
    invertSelection: matchBracketed(text, "Invert Selection"),
  };
}
