/**
 * Pure parser for `show lan` (`cli.show.lan`, cited at
 * `cli-reference-raw.txt` line 6679: "This command displays current status
 * of LAN IP address settings.", example table columns Status/IP/Mask/DHCP
 * Start IP/Pool/Gateway). No I/O, no transport, no clock.
 */

export interface ShowLanEntry {
  readonly interfaceName: string;
  readonly enabled: boolean;
  readonly ipAddress: string;
  readonly mask: string;
  readonly dhcpEnabled: boolean;
  readonly dhcpStartIp: string;
  readonly poolSize: number;
  readonly gateway: string;
}

export interface ShowLanResult {
  readonly entries: readonly ShowLanEntry[];
}

const LAN_ROW_PATTERN = /^\[([VX])\]LAN(\d+)\s+(\S+)\s+(\S+)\s+([VX])\s+(\S+)\s+(\d+)\s+(\S+)/gm;

/** Parses `show lan` output into a minimal, honest DTO. Never throws. */
export function parseShowLan(text: string): ShowLanResult {
  const entries: ShowLanEntry[] = [];

  for (const match of text.matchAll(LAN_ROW_PATTERN)) {
    const [, enabledFlag, index, ipAddress, mask, dhcpFlag, dhcpStartIp, poolSize, gateway] = match;

    entries.push({
      interfaceName: `LAN${index ?? ""}`,
      enabled: enabledFlag === "V",
      ipAddress: ipAddress ?? "",
      mask: mask ?? "",
      dhcpEnabled: dhcpFlag === "V",
      dhcpStartIp: dhcpStartIp ?? "",
      poolSize: Number(poolSize ?? 0),
      gateway: gateway ?? "",
    });
  }

  return { entries };
}
