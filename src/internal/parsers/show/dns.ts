/**
 * Pure parser for `show dns` (`cli.show.dns`, cited at
 * `cli-reference-raw.txt` line 6772: "This command displays current status
 * of DNS setting.", example output repeats "%  LAN<n>  Primary DNS: <value>"
 * / "%  LAN<n>  Secondary DNS: <value>" line pairs).
 */

export interface ShowDnsEntry {
  readonly lan: string;
  readonly primaryDns: string | null;
  readonly secondaryDns: string | null;
}

export interface ShowDnsResult {
  readonly entries: readonly ShowDnsEntry[];
}

const DNS_LINE_PATTERN = /%\s*(LAN\d+)\s+(Primary|Secondary)\s+DNS:\s*(.+?)\s*$/;

/** Parses `show dns` output into a minimal, honest DTO. Never throws. */
export function parseShowDns(text: string): ShowDnsResult {
  const byLan = new Map<string, { primaryDns: string | null; secondaryDns: string | null }>();
  const order: string[] = [];

  for (const line of text.split("\n")) {
    const match = DNS_LINE_PATTERN.exec(line);

    if (match === null) {
      continue;
    }

    const [, lan, kind, rawValue] = match;
    const lanId = lan ?? "";
    const value = rawValue === "[Not set]" ? null : (rawValue ?? null);

    if (!byLan.has(lanId)) {
      byLan.set(lanId, { primaryDns: null, secondaryDns: null });
      order.push(lanId);
    }

    const entry = byLan.get(lanId);
    if (entry === undefined) {
      continue;
    }

    if (kind === "Primary") {
      byLan.set(lanId, { ...entry, primaryDns: value });
    } else {
      byLan.set(lanId, { ...entry, secondaryDns: value });
    }
  }

  return {
    entries: order.map((lan) => {
      const value = byLan.get(lan) ?? { primaryDns: null, secondaryDns: null };
      return { lan, ...value };
    }),
  };
}
