/**
 * Shared minimal parsing helpers for the `vigbrg` domain (Wave 4
 * Item5-vigbrg family task).
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5: "Parsers are pure ... signature
 * `(text: string) => TOutput`"). `vigbrg set`'s acknowledgement text has no
 * documented structured shape beyond the free-form confirmation line
 * (`[WAN10] IPv4 bridge is enable. Set subnet[LAN100]`), so it reduces to
 * trimming the raw exchange text -- the same reasoning the sibling `wan`
 * domain applies to its own write operations
 * (`internal/parsers/wan/shared.ts`). Deliberately not imported from that
 * module: each domain's write scope stays self-contained (no cross-domain
 * shared file), per this family's own parser directory.
 */

export interface RawCommandOutput {
  readonly raw: string;
}

export function parseRawText(text: string): RawCommandOutput {
  return { raw: text.trim() };
}

/** One row of the documented "WAN mac table" printed by `vigbrg wanstatus` / `vigbrg wlanstatus`. */
export interface VigbrgMacTableEntry {
  readonly index: string;
  readonly macAddress: string;
  readonly stampTime: string;
  readonly pvc: string;
  readonly vlanPort: string;
}

export interface VigbrgMacTableReport {
  readonly bridgeState: string;
  readonly entries: readonly VigbrgMacTableEntry[];
}

const BRIDGE_STATE_PATTERN = /Vigor Bridge:\s*(\S+)/;
const HEADER_PATTERN = /Index\s+MAC Address\s+Stamp Time\s+PVC\s+VLan\s+Port/i;

/**
 * Parses the "Vigor Bridge: <state>" line plus the "WAN mac table" that
 * follows it -- the documented output shape shared verbatim by both
 * `vigbrg wanstatus` and `vigbrg wlanstatus` (rawLine 9315 / 9326).
 */
export function parseVigbrgMacTable(text: string): VigbrgMacTableReport {
  const stateMatch = BRIDGE_STATE_PATTERN.exec(text);
  const bridgeState = stateMatch?.[1] ?? "";

  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => HEADER_PATTERN.test(line));
  const entries: VigbrgMacTableEntry[] = [];

  if (headerIndex !== -1) {
    for (const line of lines.slice(headerIndex + 1)) {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        continue;
      }

      const fields = trimmed.split(/\s{2,}/);
      const [index, macAddress, stampTime, pvc, vlanPort] = fields;

      if (
        index === undefined ||
        macAddress === undefined ||
        stampTime === undefined ||
        pvc === undefined ||
        vlanPort === undefined
      ) {
        continue;
      }

      entries.push({ index, macAddress, stampTime, pvc, vlanPort });
    }
  }

  return { bridgeState, entries };
}
