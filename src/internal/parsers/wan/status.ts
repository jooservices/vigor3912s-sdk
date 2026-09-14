/**
 * Parser for `wan status` (`cli.wan.status`, rawLine 10890) -- the family's
 * one read operation.
 *
 * Pure `(text: string) => WanStatusReport` (`ARCHITECTURE.md` Item 5's
 * parser signature). The documented sample output (same rawLine) shows one
 * `BWAN<n>: <Online|Offline>, stall=<Y|N>` block per WAN interface, each
 * followed by mode/up-time, IP/gateway, TX/RX packet+rate, and primary/
 * secondary DNS lines -- exactly what the heading's own description
 * promises ("connection mode, TX/RX packets, DNS settings and IP address").
 * A block that doesn't match this exact documented shape is skipped rather
 * than guessed at.
 */

export interface WanInterfaceStatus {
  readonly interfaceLabel: string;
  readonly online: boolean;
  readonly stall: boolean;
  readonly mode: string;
  readonly upTime: string;
  readonly ipAddress: string;
  readonly gatewayIp: string;
  readonly txPackets: number;
  readonly txRateBps: number;
  readonly rxPackets: number;
  readonly rxRateBps: number;
  readonly primaryDns: string;
  readonly secondaryDns: string;
}

export interface WanStatusReport {
  readonly interfaces: readonly WanInterfaceStatus[];
}

const BLOCK_PATTERN =
  /B(WAN\d+):\s*(Online|Offline),\s*stall=([YN])\s*\r?\n\s*Mode:\s*([^,]*),\s*Up Time=([^\r\n]*)\r?\n\s*IP=([^,]*),\s*GW IP=([^\r\n]*)\r?\n\s*TX Packets=(\d+),\s*TX Rate\(bps\)=(\d+),\s*RX Packets=(\d+),\s*RX Rate\(bps\)=(\d+)\r?\n\s*Primary DNS=([^,]*),\s*Secondary DNS=([^\r\n]*)/g;

export function parseWanStatus(text: string): WanStatusReport {
  const interfaces: WanInterfaceStatus[] = [];

  for (const match of text.matchAll(BLOCK_PATTERN)) {
    const interfaceLabel = match[1];
    const onlineText = match[2];
    const stallText = match[3];
    const mode = match[4];
    const upTime = match[5];
    const ipAddress = match[6];
    const gatewayIp = match[7];
    const txPackets = match[8];
    const txRateBps = match[9];
    const rxPackets = match[10];
    const rxRateBps = match[11];
    const primaryDns = match[12];
    const secondaryDns = match[13];

    if (
      interfaceLabel === undefined ||
      onlineText === undefined ||
      stallText === undefined ||
      mode === undefined ||
      upTime === undefined ||
      ipAddress === undefined ||
      gatewayIp === undefined ||
      txPackets === undefined ||
      txRateBps === undefined ||
      rxPackets === undefined ||
      rxRateBps === undefined ||
      primaryDns === undefined ||
      secondaryDns === undefined
    ) {
      continue;
    }

    interfaces.push({
      interfaceLabel,
      online: onlineText === "Online",
      stall: stallText === "Y",
      mode: mode.trim(),
      upTime: upTime.trim(),
      ipAddress: ipAddress.trim(),
      gatewayIp: gatewayIp.trim(),
      txPackets: Number(txPackets),
      txRateBps: Number(txRateBps),
      rxPackets: Number(rxPackets),
      rxRateBps: Number(rxRateBps),
      primaryDns: primaryDns.trim(),
      secondaryDns: secondaryDns.trim(),
    });
  }

  return { interfaces };
}
