/**
 * Parser for `object service obj INDEX -v` (`cli.object.service.obj`,
 * rawLine 5807).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5). Sample response shape taken
 * verbatim from the documented example at that rawLine:
 *
 * ```
 *  Service Object Profile 1
 *  Name   :[limit]
 *  Protocol:[TCP/UDP]
 *  Source port check action:[!=]
 *  Source port range:[120~240]
 *  Destination port check action:[!=]
 *  Destination port range:[200~220]
 * ```
 */

export interface ServiceObjectProfileReport {
  readonly profileIndex: number | null;
  readonly name: string | null;
  readonly protocol: string | null;
  readonly sourcePortCheckAction: string | null;
  readonly sourcePortRange: string | null;
  readonly destinationPortCheckAction: string | null;
  readonly destinationPortRange: string | null;
}

function matchBracketed(text: string, label: string): string | null {
  const pattern = new RegExp(`${label}\\s*:\\s*\\[([^\\]]*)\\]`, "i");
  const match = pattern.exec(text);

  return match?.[1] ?? null;
}

export function parseServiceObjView(text: string): ServiceObjectProfileReport {
  const headingMatch = /Service Object Profile\s+(\d+)/i.exec(text);

  return {
    profileIndex: headingMatch?.[1] === undefined ? null : Number(headingMatch[1]),
    name: matchBracketed(text, "Name"),
    protocol: matchBracketed(text, "Protocol"),
    sourcePortCheckAction: matchBracketed(text, "Source port check action"),
    sourcePortRange: matchBracketed(text, "Source port range"),
    destinationPortCheckAction: matchBracketed(text, "Destination port check action"),
    destinationPortRange: matchBracketed(text, "Destination port range"),
  };
}
