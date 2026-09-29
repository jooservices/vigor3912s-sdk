import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildManifest, main } from "../../tools/generate-capability-manifest.ts";
import {
  assertNoDuplicateIds,
  readCommitted,
  writeOrCheckArtifact,
} from "../../tools/manifest/artifacts.ts";
import {
  buildCliEntriesForHeading,
  classifyCliCommand,
  parseCliCorpus,
} from "../../tools/manifest/classify.ts";
import {
  buildPageIndex,
  commandPathFromTitle,
  decodeDoubledLetters,
  extractCommandTitle,
  familyKey,
  findCliHeadingLines,
  slugifyCommandPath,
} from "../../tools/manifest/cli-corpus.ts";
import { sdkRoot } from "../../tools/manifest/paths.ts";
import { buildLiveFirmwareReconEntries } from "../../tools/manifest/recon.ts";
import {
  domainFamilyIdentifier,
  domainNamespaceImportIdentifier,
  formatGeneratedModule,
  renderGeneratedModule,
  renderOperationsModule,
} from "../../tools/manifest/render.ts";
import {
  parseWebUiCorpus,
  parseWebUiIndexRows,
  slugifyMenuPath,
  stripBackticks,
} from "../../tools/manifest/webui-corpus.ts";
import * as selfAssembly from "../../src/internal/registry/self-assembly.js";
import type { CapabilityEntry, CliCapabilityEntry } from "../../src/manifest/types.js";

/** Re-creates the PDF extraction's "bold = every character doubled" heading encoding. */
function doubled(text: string): string {
  return text.replace(/./g, "$&$&");
}

function heading(title: string, indent = ""): string {
  return `${indent}${doubled(`Telnet Command: ${title}`)}`;
}

const citation: CliCapabilityEntry["citation"] = {
  corpus: "user-guide-part-viii",
  rawLine: 10,
  pdfPage: 5,
};

describe("CLI corpus helpers", () => {
  it("decodes doubled-letter headings", () => {
    expect(decodeDoubledLetters(doubled("Telnet Command: wan vlan"))).toBe(
      "Telnet Command: wan vlan",
    );
  });

  it("finds column-0 and indented headings (the `wan vlan` trap), 1-based", () => {
    const lines = ["intro", heading("sys version"), "body", heading("wan vlan", "  ")];

    expect(findCliHeadingLines(lines)).toEqual([2, 4]);
  });

  it("tracks the PDF page in effect for every line", () => {
    expect(buildPageIndex(["before", "===PAGE 7===", "a", " ===PAGE 8=== ", "b"])).toEqual([
      null,
      7,
      7,
      8,
      8,
    ]);
  });

  it("extracts the command title and rejects a line without the marker", () => {
    expect(extractCommandTitle("Telnet Command: ip arp ")).toBe("ip arp");
    expect(() => extractCommandTitle("no marker here")).toThrow(/missing "Command:" marker/);
  });

  it("derives family key, command path and slug from bundled headings", () => {
    expect(familyKey("Swm Enable / disable")).toBe("swm enable");
    expect(commandPathFromTitle("wan mtu / mtu2")).toEqual(["wan", "mtu", "mtu2"]);
    expect(slugifyCommandPath(["ip", "lanDNSRes", "-v", ""])).toBe("ip.landnsres.v");
  });
});

describe("classifyCliCommand", () => {
  it("marks danger-list families destructive", () => {
    expect(classifyCliCommand("sys reboot")).toEqual({
      classification: "destructive",
      classificationBasis: "operations-danger-list",
      status: "documented",
    });
  });

  it("blocks session meta-commands with a reason", () => {
    const result = classifyCliCommand("exit");

    expect(result.status).toBe("blocked-by-documentation");
    expect(result.blockedReason).toMatch(/Session-logout/);
  });

  it("blocks commands documented without syntax", () => {
    const result = classifyCliCommand("ipf flowtest");

    expect(result.status).toBe("blocked-by-documentation");
    expect(result.classification).toBe("unknown");
  });

  it("classifies command-map read and write families", () => {
    expect(classifyCliCommand("show lan").classification).toBe("read");
    expect(classifyCliCommand("sys commit").classification).toBe("write");
  });

  it("classifies write-family prefixes (exact and with a trailing word)", () => {
    expect(classifyCliCommand("msubnet").classification).toBe("write");
    expect(classifyCliCommand("msubnet status").classification).toBe("write");
  });

  it("leaves unmatched commands unknown/unclassified — never inferred", () => {
    expect(classifyCliCommand("totally unknown cmd")).toEqual({
      classification: "unknown",
      classificationBasis: "unclassified",
      status: "documented",
    });
  });
});

describe("buildCliEntriesForHeading", () => {
  it("builds one entry for a plain heading", () => {
    const [entry, ...rest] = buildCliEntriesForHeading("show lan", citation);

    expect(rest).toHaveLength(0);
    expect(entry).toMatchObject({
      kind: "cli-command",
      id: "cli.show.lan",
      classification: "read",
      classificationBasis: "command-map-family",
      status: "documented",
      citation,
      commandPath: ["show", "lan"],
    });
  });

  it("splits documented sub-commands sharing the heading citation", () => {
    const entries = buildCliEntriesForHeading("ip route", citation);
    const ids = entries.map((entry) => entry.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "cli.ip.route",
        "cli.ip.route.add",
        "cli.ip.route.del",
        "cli.ip.route.default",
        "cli.ip.route.clean",
      ]),
    );
    for (const entry of entries) {
      expect(entry.citation).toBe(citation);
    }
    expect(entries.find((entry) => entry.id === "cli.ip.route.add")?.classification).toBe("write");
  });

  it("applies the documented-syntax overlay", () => {
    const [entry] = buildCliEntriesForHeading("csm appe config", citation);

    expect(entry).toMatchObject({
      classification: "read",
      classificationBasis: "documented-syntax",
    });
  });

  it("applies the sibling live-verified overlay", () => {
    const [entry] = buildCliEntriesForHeading("csm appe show", citation);

    expect(entry).toMatchObject({
      classification: "read",
      classificationBasis: "sibling-live-verified",
    });
  });

  it("carries blockedReason only for blocked headings", () => {
    const [blocked] = buildCliEntriesForHeading("exit", citation);
    const [plain] = buildCliEntriesForHeading("show lan", citation);

    expect(blocked?.blockedReason).toBeDefined();
    expect(plain).not.toHaveProperty("blockedReason");
  });
});

describe("parseCliCorpus", () => {
  it("parses headings with page citations from raw text", () => {
    const raw = [
      "===PAGE 12===",
      heading("show lan"),
      "Syntax show lan",
      "===PAGE 13===",
      heading("wan vlan", "  "),
    ].join("\n");

    const entries = parseCliCorpus(raw);

    expect(entries.map((entry) => entry.id)).toEqual([
      "cli.show.lan",
      "cli.wan.vlan",
      "cli.wan.vlan.stat",
    ]);
    expect(entries[0]?.citation).toEqual({
      corpus: "user-guide-part-viii",
      rawLine: 2,
      pdfPage: 12,
    });
    expect(entries[1]?.citation).toMatchObject({ rawLine: 5, pdfPage: 13 });
  });

  it("uses page 0 when no page marker precedes a heading", () => {
    const [entry] = parseCliCorpus(heading("show lan"));

    expect(entry?.citation).toMatchObject({ pdfPage: 0 });
  });
});

describe("WebUI corpus helpers", () => {
  const index = [
    "# INDEX",
    "| ignored header | before | separator |",
    "|---|---|---|",
    "| System Status | ok | `cgi-bin_v2x00.cgi_fid-1.png` |",
    "| (no title) | JS-empty | `cgi-bin_v2x00.cgi_fid-2016.png` |",
    "| too | short |",
    "not a table row",
    "| NAT >> Fast NAT | ok | `cgi-bin_v2x00.cgi_fid-2089-iAct-1.png`",
  ].join("\n");

  it("strips one layer of backticks only when present", () => {
    expect(stripBackticks(" `a.png` ")).toBe("a.png");
    expect(stripBackticks("plain")).toBe("plain");
    expect(stripBackticks("`")).toBe("`");
  });

  it("parses rows after the separator and skips short/non-table rows", () => {
    expect(parseWebUiIndexRows(index)).toEqual([
      {
        menuPath: "System Status",
        captureStatus: "ok",
        captureFile: "cgi-bin_v2x00.cgi_fid-1.png",
      },
      {
        menuPath: "(no title)",
        captureStatus: "js-empty",
        captureFile: "cgi-bin_v2x00.cgi_fid-2016.png",
      },
      {
        menuPath: "NAT >> Fast NAT",
        captureStatus: "ok",
        captureFile: "cgi-bin_v2x00.cgi_fid-2089-iAct-1.png",
      },
    ]);
  });

  it("refuses duplicate capture files", () => {
    const duplicate = ["|---|---|---|", "| A | ok | `x.png` |", "| B | ok | `x.png` |"].join("\n");

    expect(() => parseWebUiIndexRows(duplicate)).toThrow(/more than once/);
  });

  it("slugifies menu paths", () => {
    expect(slugifyMenuPath("NAT >> Port Knocking")).toBe("nat.port.knocking");
    expect(slugifyMenuPath("(!!)")).toBe("");
  });

  it("builds WebUI entries with ids, citations and WebUI-only blocks", () => {
    const entries = parseWebUiCorpus(index);

    expect(entries.map((entry) => entry.id)).toEqual([
      "webui.r1.system.status",
      "webui.r2.no.title",
      "webui.r3.nat.fast.nat",
    ]);
    expect(entries[0]).toMatchObject({ status: "documented", captureStatus: "ok" });
    expect(entries[0]).not.toHaveProperty("blockedReason");
    expect(entries[1]).toMatchObject({
      status: "blocked-by-documentation",
      captureStatus: "js-empty",
      citation: {
        corpus: "webui-capture",
        captureFile: "cgi-bin_v2x00.cgi_fid-2016.png",
        indexRow: 2,
      },
    });
    expect(entries[2]?.blockedReason).toMatch(/Fast NAT/);
  });

  it("omits the slug suffix when the menu path has no slug characters", () => {
    const [entry] = parseWebUiCorpus(["|---|---|---|", "| >> | ok | `y.png` |"].join("\n"));

    expect(entry?.id).toBe("webui.r1");
  });
});

describe("manifest generation", () => {
  it("builds live-firmware-recon entries with live citations", () => {
    const entries = buildLiveFirmwareReconEntries();

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.citation.corpus).toBe("live-firmware-recon");
      expect(["sibling-live-verified", "live-help-syntax"]).toContain(entry.classificationBasis);
      expect(entry.verifiedOnFirmware).toBe("4.4.7_RC2");
    }
  });

  it("builds the full corpus manifest with unique ids", () => {
    const manifest = buildManifest();

    expect(manifest.filter((entry) => entry.kind === "webui-page")).toHaveLength(171);
    expect(manifest.filter((entry) => entry.kind === "cli-command").length).toBeGreaterThan(400);
    expect(() => {
      assertNoDuplicateIds(manifest);
    }).not.toThrow();
  });

  it("rejects duplicate manifest ids", () => {
    const entry = buildLiveFirmwareReconEntries()[0] as CapabilityEntry;

    expect(() => {
      assertNoDuplicateIds([entry, entry]);
    }).toThrow(/Duplicate manifest id/);
  });

  it("renders the manifest module", () => {
    const rendered = renderGeneratedModule([]);

    expect(rendered).toContain("GENERATED FILE");
    expect(rendered).toContain("export const capabilityManifest = [] as const");
  });

  it("validates domain file identifiers and aliases reserved words", () => {
    expect(domainFamilyIdentifier("ip6.ts")).toBe("ip6");
    expect(() => domainFamilyIdentifier("bad-name.ts")).toThrow(
      /not a valid TypeScript identifier/,
    );
    expect(domainNamespaceImportIdentifier("switch.ts")).toBe("switchDomain");
    expect(domainNamespaceImportIdentifier("wan.ts")).toBe("wan");
  });

  it("renders the operations namespace module, including reserved-word aliases", () => {
    const rendered = renderOperationsModule(["switch.ts", "wan.ts"]);

    expect(rendered).toContain('import * as switchDomain from "../domains/switch.js";');
    expect(rendered).toContain("  switch: switchDomain,");
    expect(rendered).toContain("  wan,");
  });

  it("renders an empty operations namespace", () => {
    expect(renderOperationsModule([])).toContain("export const operations = {\n\n} as const;");
  });

  it("formats generated source with the project Prettier config", async () => {
    const formatted = await formatGeneratedModule(
      'export const x = {"a": 1}\n',
      path.join(sdkRoot, "src/manifest/example.generated.ts"),
    );

    expect(formatted).toBe("export const x = { a: 1 };\n");
  });
});

describe("artifact write/check", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "manifest-tool-test-"));
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null for a missing committed file", () => {
    expect(readCommitted(path.join(dir, "missing.ts"))).toBeNull();
  });

  it("writes in generate mode (creating directories)", () => {
    const outputPath = path.join(dir, "nested", "out.ts");

    expect(writeOrCheckArtifact({ label: "x", outputPath, rendered: "A" }, false)).toBe(true);
    expect(readFileSync(outputPath, "utf-8")).toBe("A");
  });

  it("passes check mode when the committed file matches", () => {
    const outputPath = path.join(dir, "same.ts");
    writeFileSync(outputPath, "A");

    expect(writeOrCheckArtifact({ label: "x", outputPath, rendered: "A" }, true)).toBe(true);
  });

  it("fails check mode on drift and on a missing file, without overwriting", () => {
    const outputPath = path.join(dir, "drift.ts");
    writeFileSync(outputPath, "OLD");

    expect(writeOrCheckArtifact({ label: "x", outputPath, rendered: "NEW" }, true)).toBe(false);
    expect(readFileSync(outputPath, "utf-8")).toBe("OLD");
    expect(
      writeOrCheckArtifact(
        { label: "x", outputPath: path.join(dir, "none.ts"), rendered: "N" },
        true,
      ),
    ).toBe(false);
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/stale\/drifted/));
    expect(console.error).toHaveBeenCalledWith(expect.stringMatching(/does not exist/));
  });
});

describe("main (check mode against the committed artifacts)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports every committed artifact in sync, loading domains from source", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      main(["node", "generate-capability-manifest.ts", "--check"], {
        loadSelfAssembly: () => Promise.resolve(selfAssembly),
        domainsImportDir: undefined,
      }),
    ).resolves.toBe(true);
    expect(error).not.toHaveBeenCalled();
    expect(log.mock.calls.length).toBeGreaterThan(0);
    for (const [message] of log.mock.calls) {
      expect(String(message)).toMatch(/^manifest:check OK — /);
    }
  }, 120_000);
});
