/** WebUI capture INDEX parsing (pure). */

import type { WebUiCapabilityEntry } from "../../src/manifest/types.js";

export interface WebUiIndexRow {
  readonly menuPath: string;
  readonly captureStatus: "ok" | "js-empty";
  readonly captureFile: string;
}

/** Strips a single layer of Markdown inline-code backticks, if present. */
export function stripBackticks(cell: string): string {
  const trimmed = cell.trim();

  if (trimmed.startsWith("`") && trimmed.endsWith("`") && trimmed.length >= 2) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * AppleDouble trap, resolved (`ARCHITECTURE.md`, `BACKLOG.md` A3): this
 * generator never scans the `webui-capture/` directory tree — it parses
 * only `INDEX.md`'s markdown table — but the trap the architecture flags is
 * real and was verified by hand: `webui-capture/{pages,html,text}/` each
 * contain exactly 3 files named `._cgi-bin_v2x00.cgi_fid-{2196,2197,2297}.*`
 * (9 files total). A *naive* rule ("any `._`-prefixed file is a macOS
 * AppleDouble resource-fork sidecar, drop it") turns out to be wrong here:
 * inspecting their bytes shows real PNG/HTML/plain-text page content (e.g.
 * `._cgi-bin_v2x00.cgi_fid-2196.txt` is 749 bytes of real WAN/LAN status
 * text, not the AppleDouble binary magic `0x00051607`), and `INDEX.md`
 * cites exactly these 3 filenames for 3 otherwise-undocumented, non-
 * duplicate rows ("NAT >> Sessions", "Port Setup", "System Maintenance >>
 * Max Connection" — `grep -n "2297\\|2196\\|2197" INDEX.md`). `text/` holds
 * 168 normally-named `.txt` files + these 3 `._`-prefixed ones = 171,
 * matching `INDEX.md`'s row count exactly. So: (a) a *directory* glob over
 * `text/` must not blanket-exclude `._*` — doing so here would silently
 * undercount to 168 and drop 3 real pages; (b) this generator sidesteps the
 * whole question by trusting `INDEX.md`'s 171 rows as ground truth and
 * never re-deriving the count from a filesystem scan. No row is dropped by
 * capture-file name here — only true accidental duplicate rows (same
 * `captureFile` cited twice) would ever be excluded, and none exist (every
 * one of the 171 `captureFile` values in `INDEX.md` is unique).
 */
export function parseWebUiIndexRows(indexText: string): readonly WebUiIndexRow[] {
  const rows: WebUiIndexRow[] = [];
  let sawSeparator = false;

  for (const line of indexText.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("|---")) {
      sawSeparator = true;
      continue;
    }

    if (!sawSeparator || !trimmed.startsWith("|")) {
      continue;
    }

    const cells = trimmed
      .slice(1, trimmed.endsWith("|") ? -1 : undefined)
      .split("|")
      .map((cell) => cell.trim());

    if (cells.length < 3) {
      continue;
    }

    const [menuCell, statusCell, captureCell] = cells as [string, string, string];
    const captureFile = stripBackticks(captureCell);
    const statusToken = stripBackticks(statusCell);
    const captureStatus: "ok" | "js-empty" = statusToken.includes("JS") ? "js-empty" : "ok";

    rows.push({ menuPath: menuCell, captureStatus, captureFile });
  }

  const seenCaptureFiles = new Set<string>();

  for (const row of rows) {
    if (seenCaptureFiles.has(row.captureFile)) {
      throw new Error(
        `INDEX.md cites the capture file "${row.captureFile}" more than once; ` +
          "refusing to generate duplicate WebUI manifest entries.",
      );
    }

    seenCaptureFiles.add(row.captureFile);
  }

  return rows;
}

/**
 * WebUI-only functions (no CLI equivalent documented in Part VIII, per
 * `webui-map.md`): Configuration Backup and Firmware Upgrade are the two
 * `(no title)` JS-empty captures identified by `webui-map.md`'s note
 * ("Pages captured as empty ...: ... Configuration Backup (`fid=2016`),
 * Firmware Upgrade (`fid=2019`)"); Port Knocking and Fast NAT are captured
 * `ok` NAT sub-pages `webui-map.md` explicitly marks "WebUI-only (verify:
 * no CLI command found in Part VIII)". Matched by exact capture-file name
 * (a location fact from `INDEX.md`/`webui-map.md`, not embedded content).
 */
const WEBUI_ONLY_BLOCKED_REASONS: ReadonlyMap<string, string> = new Map([
  [
    "cgi-bin_v2x00.cgi_fid-2016.png",
    "WebUI-only function (Configuration Backup): no CLI export/import command exists in " +
      "Part VIII per webui-map.md; the capture also rendered no static content (JS/Angular SPA).",
  ],
  [
    "cgi-bin_v2x00.cgi_fid-2019.png",
    "WebUI-only function (Firmware Upgrade): no CLI upload command exists in Part VIII per " +
      "webui-map.md (only `sys tftpd` enables the TFTP server); the capture also rendered no " +
      "static content (JS/Angular SPA).",
  ],
  [
    "cgi-bin_ptknock.cgi_fid-0-iPageIdx-1.png",
    "WebUI-only function (NAT >> Port Knocking): webui-map.md records no corresponding CLI " +
      "command in Part VIII.",
  ],
  [
    "cgi-bin_v2x00.cgi_fid-2089-iAct-1.png",
    "WebUI-only function (NAT >> Fast NAT): webui-map.md records no corresponding CLI command " +
      "in Part VIII.",
  ],
]);

export function slugifyMenuPath(menuPath: string): string {
  return menuPath
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0)
    .join(".");
}

export function parseWebUiCorpus(indexText: string): readonly WebUiCapabilityEntry[] {
  const rows = parseWebUiIndexRows(indexText);

  return rows.map((row, zeroBasedIndex) => {
    const indexRow = zeroBasedIndex + 1;
    const slug = slugifyMenuPath(row.menuPath);
    const id = `webui.r${String(indexRow)}${slug.length > 0 ? `.${slug}` : ""}`;
    const blockedReason = WEBUI_ONLY_BLOCKED_REASONS.get(row.captureFile);

    const entry: WebUiCapabilityEntry = {
      kind: "webui-page",
      id,
      title: row.menuPath,
      citation: { corpus: "webui-capture", captureFile: row.captureFile, indexRow },
      classification: "unknown",
      classificationBasis: "unclassified",
      status: blockedReason !== undefined ? "blocked-by-documentation" : "documented",
      ...(blockedReason !== undefined ? { blockedReason } : {}),
      operationIds: [],
      menuPath: row.menuPath,
      captureStatus: row.captureStatus,
      firmwareBasis: "live-capture-4.4.7_RC2",
    };

    return entry;
  });
}
