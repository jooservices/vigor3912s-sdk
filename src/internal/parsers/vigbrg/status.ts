/**
 * Parser for `vigbrg status` (`cli.vigbrg.status`, rawLine 9290) -- the
 * documented sample output shows one "%Vigor Bridge Function is
 * enable|disable!" line, followed by zero or more
 * "%Wan<n> management is enable|disable!" lines (one per bridged WAN).
 */

export interface VigbrgWanManagementStatus {
  readonly wanLabel: string;
  readonly enabled: boolean;
}

export interface VigbrgStatusReport {
  /** `null` when the function state line is missing. */
  readonly functionEnabled: boolean | null;
  readonly wanManagement: readonly VigbrgWanManagementStatus[];
}

const FUNCTION_PATTERN = /Vigor Bridge Function is (enable|disable)/i;
const WAN_MANAGEMENT_PATTERN = /Wan(\d+) management is (enable|disable)/gi;

export function parseStatus(text: string): VigbrgStatusReport {
  const functionMatch = FUNCTION_PATTERN.exec(text);
  const state = functionMatch?.[1]?.toLowerCase();
  const functionEnabled = state === undefined ? null : state === "enable";

  const wanManagement: VigbrgWanManagementStatus[] = [];

  for (const match of text.matchAll(WAN_MANAGEMENT_PATTERN)) {
    const wanNumber = match[1];
    const state = match[2];

    if (wanNumber === undefined || state === undefined) {
      continue;
    }

    wanManagement.push({
      wanLabel: `WAN${wanNumber}`,
      enabled: state.toLowerCase() === "enable",
    });
  }

  return { functionEnabled, wanManagement };
}
