/**
 * Parser for `vlan status` (`cli.vlan.status`, rawLine 9426) -- the family's
 * one read operation.
 *
 * The documented table (see rawLine 9434-9459) is fixed-width in the source
 * PDF but the extracted `cli-reference-raw.txt` text loses exact column
 * alignment, so the per-port `V` marker columns can't be reliably mapped back
 * to specific port numbers from this text alone. Each channel row is parsed
 * into its reliably-delimited fields (channel id, on/off state, VID,
 * priority, subnet) plus the raw tagged-port marker segment verbatim
 * (`ports`) -- not decomposed into per-port booleans, consistent with
 * `./shared.ts`'s "don't assert detail the vendor documentation does not
 * support" principle.
 */

export interface VlanChannelStatus {
  readonly channel: number;
  readonly enabled: boolean;
  readonly vid: number;
  readonly priority: number;
  /** Raw tagged-port marker segment for this row (e.g. `"V     V"`), verbatim. */
  readonly ports: string;
  readonly subnet: string;
}

export interface VlanStatusReport {
  readonly vlanEnabled: boolean;
  readonly channels: readonly VlanChannelStatus[];
}

const HEADER_LINE_PATTERN = /^VLAN\s+is\s+(Enable|Disable)\s*:/i;
const CHANNEL_LINE_PATTERN = /^\s*(\d+)\s+(ON|OFF)\s+(\d+)\s+(\d+)\s+(.*?)\s+(\d+:\S+)\s*$/;

export function parseVlanStatus(text: string): VlanStatusReport {
  let vlanEnabled = false;
  const channels: VlanChannelStatus[] = [];

  for (const line of text.split(/\r?\n/)) {
    const headerMatch = HEADER_LINE_PATTERN.exec(line);

    if (headerMatch?.[1] !== undefined) {
      vlanEnabled = headerMatch[1].toLowerCase() === "enable";
      continue;
    }

    const rowMatch = CHANNEL_LINE_PATTERN.exec(line);

    if (rowMatch === null) {
      continue;
    }

    const [, channel, state, vid, priority, ports, subnet] = rowMatch;

    if (
      channel === undefined ||
      state === undefined ||
      vid === undefined ||
      priority === undefined ||
      ports === undefined ||
      subnet === undefined
    ) {
      continue;
    }

    channels.push({
      channel: Number(channel),
      enabled: state === "ON",
      vid: Number(vid),
      priority: Number(priority),
      ports: ports.trim(),
      subnet,
    });
  }

  return { vlanEnabled, channels };
}
