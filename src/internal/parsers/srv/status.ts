/**
 * Parser for `srv dhcp status` (`cli.srv.dhcp.status`, rawLine 7172) --
 * the family's one read operation, structured from the documented sample
 * output:
 *
 * ```
 * LAN1       : DHCP Server On    IP Pool: 192.168.1.10 ~ 192.168.1.209
 *              Default Gateway: 192.168.1.1
 * ------------------------------------------------------------------------
 * Index   IP Address      MAC Address             Leased Time     HOST ID
 * ------------------------------------------------------------------------
 * LAN1
 * 1       192.168.1.10    08-BF-B8-D5-DD-A9       69:01:37        A1000460>
 * ```
 *
 * The trailing `>` on the last documented line is the DrayOS shell prompt
 * bleeding into the sample text, not part of the HOST ID -- stripped here.
 * Pure, no I/O (`ARCHITECTURE.md` Item 5's parser signature).
 */

const HEADER_PATTERN = /^(\S+)\s*:\s*DHCP Server (On|Off)\s*IP Pool:\s*(\S+)\s*~\s*(\S+)/m;
const GATEWAY_PATTERN = /Default Gateway:\s*(\S+)/;
const LEASE_ROW_PATTERN = /^(\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+([0-9A-Fa-f-]+)\s+(\S+)\s+(\S+)\s*$/;

export interface DhcpLease {
  readonly index: number;
  readonly ipAddress: string;
  readonly macAddress: string;
  readonly leasedTime: string;
  readonly hostId: string;
}

export interface DhcpStatusReport {
  readonly interfaceLabel: string | null;
  readonly serverOn: boolean | null;
  readonly poolStart: string | null;
  readonly poolEnd: string | null;
  readonly defaultGateway: string | null;
  readonly leases: readonly DhcpLease[];
}

function stripTrailingPrompt(value: string): string {
  return value.endsWith(">") ? value.slice(0, -1) : value;
}

export function parseDhcpStatus(text: string): DhcpStatusReport {
  const headerMatch = HEADER_PATTERN.exec(text);
  const gatewayMatch = GATEWAY_PATTERN.exec(text);

  const leases: DhcpLease[] = [];

  for (const line of text.split("\n")) {
    const rowMatch = LEASE_ROW_PATTERN.exec(line.trimEnd());

    if (rowMatch === null) {
      continue;
    }

    const [, index, ipAddress, macAddress, leasedTime, hostId] = rowMatch as unknown as [
      string,
      string,
      string,
      string,
      string,
      string,
    ];

    leases.push({
      index: Number.parseInt(index, 10),
      ipAddress,
      macAddress,
      leasedTime,
      hostId: stripTrailingPrompt(hostId),
    });
  }

  return {
    interfaceLabel: headerMatch?.[1] ?? null,
    serverOn: headerMatch === null ? null : headerMatch[2] === "On",
    poolStart: headerMatch?.[3] ?? null,
    poolEnd: headerMatch?.[4] ?? null,
    defaultGateway: gatewayMatch?.[1] ?? null,
    leases,
  };
}
