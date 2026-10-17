/**
 * Pure parser for `show portmap` (`cli.show.portmap`, cited at
 * `cli-reference-raw.txt` line 6813: "This command displays the table of NAT
 * Active Sessions.", example output columns: Protocol,
 * Private_IP:Port, Pseudo_IP:Port, Peer_IP:Port, ST, LastTime, DPDK).
 */

export interface ShowPortmapEntry {
  readonly protocol: number;
  readonly privateIp: string;
  readonly privatePort: number;
  readonly pseudoIp: string;
  readonly pseudoPort: number;
  readonly peerIp: string;
  readonly peerPort: number;
  readonly state: number;
  readonly lastTime: number;
  readonly dpdk: number;
}

export interface ShowPortmapResult {
  readonly entries: readonly ShowPortmapEntry[];
}

const ROW_PATTERN =
  /^\s*(\d+)\s+(\S+):(\d+)\s+(\S+):(\d+)\s+(\S+):\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/;

/** Parses `show portmap` output into a minimal, honest DTO. Never throws. */
export function parseShowPortmap(text: string): ShowPortmapResult {
  const entries: ShowPortmapEntry[] = [];

  for (const line of text.split("\n")) {
    const match = ROW_PATTERN.exec(line);

    if (match === null) {
      continue;
    }

    const [
      ,
      protocol,
      privateIp,
      privatePort,
      pseudoIp,
      pseudoPort,
      peerIp,
      peerPort,
      state,
      lastTime,
      dpdk,
    ] = match;

    entries.push({
      protocol: Number(protocol),
      privateIp: privateIp as string,
      privatePort: Number(privatePort),
      pseudoIp: pseudoIp as string,
      pseudoPort: Number(pseudoPort),
      peerIp: peerIp as string,
      peerPort: Number(peerPort),
      state: Number(state),
      lastTime: Number(lastTime),
      dpdk: Number(dpdk),
    });
  }

  return { entries };
}
