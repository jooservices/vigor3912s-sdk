/**
 * Pure parser for `show status` (`cli.show.status`, cited at
 * `cli-reference-raw.txt` line 6867: "This command displays current status
 * of LAN and WAN connections."). Sample text sourced from the literal
 * example output block already embedded in
 * `.ai/skills/vigor3912s/references/command-map.md` (per the accepted
 * Task 3 fixture-import precedent — no live capture has been imported, and
 * this block is the manual's own documented example, not device-specific
 * capture content).
 */

export interface ShowStatusLan {
  readonly primaryDns: string | null;
  readonly secondaryDns: string | null;
  readonly ipAddress: string | null;
  readonly txRate: number | null;
  readonly rxRate: number | null;
}

export interface ShowStatusWan {
  readonly index: number;
  readonly connectionStatus: string;
  readonly enabled: boolean | null;
  readonly line: string | null;
  readonly name: string | null;
  readonly mode: string | null;
  readonly upTime: string | null;
  readonly ip: string | null;
  readonly gatewayIp: string | null;
}

export interface ShowStatusResult {
  readonly systemUptime: string | null;
  readonly lan: ShowStatusLan;
  readonly wans: readonly ShowStatusWan[];
}

const WAN_BLOCK_PATTERN =
  /WAN\s+(\d+)\s+Status:\s*(\S+)[\s\S]*?Enable:(\S+)\s+Line:(\S+)\s+Name:\s*(\S*)[\s\S]*?Mode:(.+?)\s+Up Time:(\S+)\s+IP:(\S+)\s+GW IP:(\S+)/g;

function dashToNull(value: string | undefined): string | null {
  if (value === undefined || value === "---" || value === "") {
    return null;
  }
  return value;
}

/** Parses `show status` output into a minimal, honest DTO. Never throws. */
export function parseShowStatus(text: string): ShowStatusResult {
  const uptimeMatch = /System Uptime:(\S+)/.exec(text);
  const primaryDnsMatch = /Primary DNS:(\S+)/.exec(text);
  const secondaryDnsMatch = /Secondary DNS:(\S+)/.exec(text);
  const ipMatch = /IP Address:(\S+)/.exec(text);
  const txRateMatch = /Tx Rate:(\d+)/.exec(text);
  const rxRateMatch = /Rx Rate:(\d+)/.exec(text);

  const wans: ShowStatusWan[] = [];

  for (const match of text.matchAll(WAN_BLOCK_PATTERN)) {
    const [, index, connectionStatus, enableFlag, line, name, mode, upTime, ip, gwIp] = match;

    wans.push({
      index: Number(index ?? 0),
      connectionStatus: connectionStatus ?? "",
      enabled: enableFlag === undefined ? null : enableFlag === "Yes",
      line: dashToNull(line),
      name: dashToNull(name),
      mode: dashToNull(mode),
      upTime: dashToNull(upTime),
      ip: dashToNull(ip),
      gatewayIp: dashToNull(gwIp),
    });
  }

  return {
    systemUptime: uptimeMatch?.[1] ?? null,
    lan: {
      primaryDns: primaryDnsMatch?.[1] ?? null,
      secondaryDns: secondaryDnsMatch?.[1] ?? null,
      ipAddress: ipMatch?.[1] ?? null,
      txRate: txRateMatch === null ? null : Number(txRateMatch[1]),
      rxRate: rxRateMatch === null ? null : Number(rxRateMatch[1]),
    },
    wans,
  };
}
