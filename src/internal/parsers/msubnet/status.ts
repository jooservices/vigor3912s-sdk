/**
 * Parser for `msubnet status` (`cli.msubnet.status`, rawLine 4757) -- the
 * family's one read operation.
 *
 * Pure `(text: string) => MsubnetStatusReport` (`ARCHITECTURE.md` Item 5's
 * parser signature). The heading's own documented example (same rawLine)
 * shows exactly one subnet's status per invocation (one `<lanLabel>` index is
 * always given as the command's own argument), across three lines:
 *
 * ```
 * % LAN2        Off: 0.0.0.0/0.0.0.0, PPP Start IP: 0.0.0.60
 * % DHCP server: Off
 * % Dhcp Gateway: 0.0.0.0, Start IP: 0.0.0.10, Pool Count: 50
 * ```
 *
 * Synthetic sample text is used in tests (Wave 4's per-family task note:
 * "no command-map.md examples for this family"); the shape modelled here
 * follows this same documented example one-for-one.
 */

export interface MsubnetStatusReport {
  readonly interfaceLabel: string;
  readonly subnetEnabled: boolean;
  readonly ipAddress: string;
  readonly netmask: string;
  readonly pppStartIp: string;
  readonly dhcpServerEnabled: boolean;
  readonly dhcpGatewayIp: string;
  readonly dhcpStartIp: string;
  readonly dhcpPoolCount: number;
}

const STATUS_PATTERN =
  /%\s*(\S+)\s+(On|Off):\s*([\d.]+)\/([\d.]+),\s*PPP Start IP:\s*([\d.]+)\s*\r?\n%\s*DHCP server:\s*(On|Off)\s*\r?\n%\s*Dhcp Gateway:\s*([\d.]+),\s*Start IP:\s*([\d.]+),\s*Pool Count:\s*(\d+)/;

export function parseMsubnetStatus(text: string): MsubnetStatusReport | null {
  const match = STATUS_PATTERN.exec(text);

  if (match === null) {
    return null;
  }

  const [
    ,
    interfaceLabel,
    subnetStateText,
    ipAddress,
    netmask,
    pppStartIp,
    dhcpStateText,
    dhcpGatewayIp,
    dhcpStartIp,
    dhcpPoolCountText,
  ] = match;

  if (
    interfaceLabel === undefined ||
    subnetStateText === undefined ||
    ipAddress === undefined ||
    netmask === undefined ||
    pppStartIp === undefined ||
    dhcpStateText === undefined ||
    dhcpGatewayIp === undefined ||
    dhcpStartIp === undefined ||
    dhcpPoolCountText === undefined
  ) {
    return null;
  }

  return {
    interfaceLabel,
    subnetEnabled: subnetStateText === "On",
    ipAddress,
    netmask,
    pppStartIp,
    dhcpServerEnabled: dhcpStateText === "On",
    dhcpGatewayIp,
    dhcpStartIp,
    dhcpPoolCount: Number(dhcpPoolCountText),
  };
}
