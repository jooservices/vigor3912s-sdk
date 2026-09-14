/**
 * Parser for `upnp nat` (`cli.upnp.nat`, rawLine 9029) -- "This command can
 * display IGD NAT status."
 *
 * Pure, no I/O (`ARCHITECTURE.md` Item 5). The documented example
 * (`cli-reference-raw.txt` rawLine 9029) shows a numbered `((n))` block per
 * NAT mapping entry, each with `Key >>value<<`-formatted fields on their own
 * lines:
 *
 * ```
 * ((0))
 * InternalClient >>192.168.1.10<<, RemoteHost >>0.0.0.0<<
 * InternalPort >>21<<, ExternalPort >>21<<
 * PortMapProtocol >>TCP<<
 * The tmpvirtual server index >>0<<
 * PortMapLeaseDuration >>0<<, PortMapEnabled >>0<<
 * ```
 *
 * Unmatched/malformed text yields an empty `entries` array (same
 * fail-soft convention as `wan status`'s parser) rather than throwing --
 * a parser is never the place to reject transport-level surprises.
 */

export interface UpnpNatEntry {
  readonly index: number;
  readonly internalClient: string;
  readonly remoteHost: string;
  readonly internalPort: number;
  readonly externalPort: number;
  readonly protocol: string;
  readonly tmpVirtualServerIndex: number;
  readonly portMapLeaseDuration: number;
  readonly portMapEnabled: boolean;
}

export interface UpnpNatReport {
  readonly entries: readonly UpnpNatEntry[];
}

const ENTRY_HEADER_PATTERN = /\(\((\d+)\)\)/g;

function extractField(block: string, pattern: RegExp): string | undefined {
  return pattern.exec(block)?.[1];
}

function parseEntryBlock(index: number, block: string): UpnpNatEntry | undefined {
  // Non-greedy `[\s\S]*?` (rather than `[^<]*`) is required because the
  // documented "no mapping" placeholder value is itself `<NULL>` -- a value
  // containing `<` -- so a class excluding `<` would wrongly stop early and
  // fail to match up to the closing `<<` delimiter.
  const internalClient = extractField(block, /InternalClient\s*>>([\s\S]*?)<</);
  const remoteHost = extractField(block, /RemoteHost\s*>>([\s\S]*?)<</);
  const internalPortText = extractField(block, /InternalPort\s*>>([\s\S]*?)<</);
  const externalPortText = extractField(block, /ExternalPort\s*>>([\s\S]*?)<</);
  const protocol = extractField(block, /PortMapProtocol\s*>>([\s\S]*?)<</);
  const tmpVirtualServerIndexText = extractField(
    block,
    /tmpvirtual server index\s*>>([\s\S]*?)<</i,
  );
  const portMapLeaseDurationText = extractField(block, /PortMapLeaseDuration\s*>>([\s\S]*?)<</);
  const portMapEnabledText = extractField(block, /PortMapEnabled\s*>>([\s\S]*?)<</);

  if (
    internalClient === undefined ||
    remoteHost === undefined ||
    internalPortText === undefined ||
    externalPortText === undefined ||
    protocol === undefined ||
    tmpVirtualServerIndexText === undefined ||
    portMapLeaseDurationText === undefined ||
    portMapEnabledText === undefined
  ) {
    return undefined;
  }

  return {
    index,
    internalClient,
    remoteHost,
    internalPort: Number.parseInt(internalPortText, 10),
    externalPort: Number.parseInt(externalPortText, 10),
    protocol,
    tmpVirtualServerIndex: Number.parseInt(tmpVirtualServerIndexText, 10),
    portMapLeaseDuration: Number.parseInt(portMapLeaseDurationText, 10),
    portMapEnabled: portMapEnabledText.trim() !== "0",
  };
}

export function parseUpnpNat(text: string): UpnpNatReport {
  const headerMatches = [...text.matchAll(ENTRY_HEADER_PATTERN)];

  if (headerMatches.length === 0) {
    return { entries: [] };
  }

  const entries: UpnpNatEntry[] = [];

  for (const [position, headerMatch] of headerMatches.entries()) {
    const blockStart = headerMatch.index + headerMatch[0].length;
    const nextHeaderMatch = headerMatches[position + 1];
    const blockEnd = nextHeaderMatch?.index ?? text.length;
    const block = text.slice(blockStart, blockEnd);
    const indexText = headerMatch[1];

    if (indexText === undefined) {
      continue;
    }

    const entry = parseEntryBlock(Number.parseInt(indexText, 10), block);

    if (entry !== undefined) {
      entries.push(entry);
    }
  }

  return { entries };
}
