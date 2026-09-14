/**
 * Parser for `switch list` (`cli.switch.list`, rawLine 7745).
 *
 * The documented sample output (same rawLine) is a header row, a dashed
 * separator, then one `[<no>] <mac> <ip> <status> <dur time> <cwmp>
 * <acs_ctl> <model_name> [<firmware_version>]` row per connected external
 * device -- exactly what the heading's own description promises ("display
 * the connection status of the switch"). The trailing firmware-version
 * column is optional because the documented sample row itself omits it. A
 * row that doesn't match this exact documented shape is skipped rather than
 * guessed at.
 */

export interface SwitchListEntry {
  readonly index: number;
  readonly mac: string;
  readonly ip: string;
  readonly status: string;
  readonly durationTime: string;
  readonly cwmp: string;
  readonly acsCtl: string;
  readonly modelName: string;
  readonly firmwareVersion: string | undefined;
}

export interface SwitchListReport {
  readonly devices: readonly SwitchListEntry[];
}

const ROW_PATTERN =
  /^\[(\d+)]\s+([0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5})\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)(?:\s+(\S+))?\s*$/gm;

export function parseSwitchList(text: string): SwitchListReport {
  const devices: SwitchListEntry[] = [];

  for (const match of text.matchAll(ROW_PATTERN)) {
    const [, indexText, mac, ip, status, durationTime, cwmp, acsCtl, modelName, firmwareVersion] =
      match;

    if (
      indexText === undefined ||
      mac === undefined ||
      ip === undefined ||
      status === undefined ||
      durationTime === undefined ||
      cwmp === undefined ||
      acsCtl === undefined ||
      modelName === undefined
    ) {
      continue;
    }

    devices.push({
      index: Number(indexText),
      mac,
      ip,
      status,
      durationTime,
      cwmp,
      acsCtl,
      modelName,
      firmwareVersion,
    });
  }

  return { devices };
}
