import { describe, expect, it } from "vitest";

import { capabilityManifest as generatedManifest } from "../../src/manifest/capability-manifest.generated.js";
import type { CapabilityEntry } from "../../src/manifest/types.js";

// Widened to the general `CapabilityEntry` union (rather than the generated
// file's precise `as const` literal-tuple type) so property access below
// reflects the documented schema's optionality (e.g. `blockedReason?`)
// instead of each individual literal's exact, narrower shape.
const capabilityManifest: readonly CapabilityEntry[] = generatedManifest;

/**
 * `ARCHITECTURE.md`'s amended Item 1 census invariant: coverage, not a fixed
 * total. A heading documenting several distinct commands (e.g. "linux",
 * "sys cfg", "mngt rmtcfg") emits one entry per real command, all citing
 * back to that same shared heading — so the 327/171 counts are now asserted
 * over the *distinct citation* set, not the entry count.
 */
function cliCitationKey(entry: CapabilityEntry): string | null {
  if (entry.kind !== "cli-command" || entry.citation.corpus !== "user-guide-part-viii") {
    return null;
  }

  return `${String(entry.citation.rawLine)}:${String(entry.citation.pdfPage)}`;
}

function webUiCitationKey(entry: CapabilityEntry): string | null {
  if (entry.kind !== "webui-page" || entry.citation.corpus !== "webui-capture") {
    return null;
  }

  return `${entry.citation.captureFile}:${String(entry.citation.indexRow)}`;
}

describe("capability manifest census", () => {
  it("covers exactly 327 distinct CLI heading citations (rawLine/pdfPage), regardless of split entry count", () => {
    const cliCitationKeys = capabilityManifest
      .map(cliCitationKey)
      .filter((key): key is string => key !== null);

    expect(new Set(cliCitationKeys).size).toBe(327);
  });

  it("covers exactly 171 distinct WebUI row citations (captureFile/indexRow)", () => {
    const webUiCitationKeys = capabilityManifest
      .map(webUiCitationKey)
      .filter((key): key is string => key !== null);

    expect(new Set(webUiCitationKeys).size).toBe(171);
  });

  it("has at least 498 entries total (327 + 171, plus any per-command splits)", () => {
    expect(capabilityManifest.length).toBeGreaterThanOrEqual(498);
  });

  it("has unique ids across every entry", () => {
    const ids = capabilityManifest.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every entry a citation", () => {
    for (const entry of capabilityManifest) {
      expect(entry.citation).toBeDefined();
    }
  });

  it("gives every entry a status", () => {
    const validStatuses = new Set(["documented", "implemented", "blocked-by-documentation"]);

    for (const entry of capabilityManifest) {
      expect(validStatuses.has(entry.status)).toBe(true);
    }
  });

  it("sets blockedReason if and only if status is blocked-by-documentation", () => {
    for (const entry of capabilityManifest) {
      if (entry.status === "blocked-by-documentation") {
        expect(entry.blockedReason).toBeTruthy();
      } else {
        expect(entry.blockedReason).toBeUndefined();
      }
    }
  });

  it("includes the indented 'wan vlan' CLI heading (raw line 11191)", () => {
    const wanVlan = capabilityManifest.find(
      (entry) => entry.kind === "cli-command" && entry.command === "wan vlan",
    );

    expect(wanVlan).toBeDefined();
    expect(wanVlan?.citation).toEqual({
      corpus: "user-guide-part-viii",
      rawLine: 11191,
      pdfPage: 800,
    });
  });

  it("emits the four operations.md danger-list commands as destructive entries (never excluded, whether or not Wave 4 has implemented them)", () => {
    const dangerListCommands = [
      "sys cfg default",
      "sys reboot",
      "mngt rmtcfg enable",
      "linux clean -w",
      "linux clean -o",
    ];

    // `sys cfg default`, `mngt rmtcfg enable`, `linux clean -w`, `linux
    // clean -o` are the danger-list entries produced by splitting a shared
    // heading (`sys cfg`, `mngt rmtcfg`, `linux`); `sys reboot` has its own
    // dedicated heading. All five must exist and be classification
    // "destructive" — always, regardless of Wave 4 progress.
    //
    // `status` is deliberately NOT asserted to be permanently "documented"
    // here: per `ARCHITECTURE.md`'s 2026-09-13 amendment, "destructive" is
    // accurate metadata only, not an exclusion — a Wave 4 family task may
    // legitimately implement a destructive command (classification is
    // metadata only; consumers own write policy — e.g. LiveReadOnlyClient,
    // MCP confirm). Once implemented, `status` correctly flips to
    // "implemented" with `operationIds` populated; this test instead asserts
    // that whichever status it has is internally consistent.
    const destructiveEntries = capabilityManifest.filter(
      (entry) => entry.kind === "cli-command" && dangerListCommands.includes(entry.command),
    );

    expect(destructiveEntries).toHaveLength(dangerListCommands.length);

    for (const entry of destructiveEntries) {
      expect(entry.classification).toBe("destructive");
      expect(entry.classificationBasis).toBe("operations-danger-list");
      expect(["documented", "implemented"]).toContain(entry.status);
      if (entry.status === "implemented") {
        expect(entry.operationIds.length).toBeGreaterThan(0);
      } else {
        expect(entry.operationIds).toHaveLength(0);
      }
    }
  });

  it("derives exactly one entry per documented WebUI capture file, no phantom duplicates", () => {
    // Guards the AppleDouble trap the other direction: `webui-capture/text/`
    // holds 168 normally-named files plus 3 real (non-sidecar) `._`-prefixed
    // captures cited by INDEX.md, totalling 171. A naive glob/regex could
    // either double-count sidecars as extra phantom entries, or wrongly
    // exclude those 3 real `._`-prefixed captures. Neither happened: exactly
    // 171 distinct WebUI citations (asserted above) and every captureFile
    // citation is unique.
    const captureFiles = capabilityManifest
      .filter((entry) => entry.kind === "webui-page" && entry.citation.corpus === "webui-capture")
      .map((entry) =>
        entry.citation.corpus === "webui-capture" ? entry.citation.captureFile : "",
      );

    expect(new Set(captureFiles).size).toBe(captureFiles.length);
    expect(captureFiles.every((file) => file.length > 0)).toBe(true);
  });

  it("never embeds capture/document content in a citation (locations only)", () => {
    for (const entry of capabilityManifest) {
      if (entry.citation.corpus === "user-guide-part-viii") {
        expect(typeof entry.citation.rawLine).toBe("number");
        expect(typeof entry.citation.pdfPage).toBe("number");
      } else if (entry.citation.corpus === "webui-capture") {
        expect(typeof entry.citation.captureFile).toBe("string");
        expect(typeof entry.citation.indexRow).toBe("number");
      } else {
        expect(entry.citation.corpus).toBe("live-firmware-recon");
        expect(entry.citation.firmware).toBe("4.4.7_RC2");
        expect(typeof entry.citation.evidenceRef).toBe("string");
        expect(entry.citation.evidenceRef.length).toBeGreaterThan(0);
      }
    }
  });

  it("covers additive live-firmware-recon CLI entries without disturbing the 327 PDF heading census", () => {
    const recon = capabilityManifest.filter(
      (entry): entry is Extract<CapabilityEntry, { kind: "cli-command" }> =>
        entry.kind === "cli-command" && entry.citation.corpus === "live-firmware-recon",
    );

    expect(recon.length).toBeGreaterThan(0);

    for (const entry of recon) {
      expect(entry.firmwareBasis).toBe("live-recon-4.4.7_RC2");
      expect(entry.verifiedOnFirmware).toBe("4.4.7_RC2");
      expect(entry.classificationBasis).toBe("sibling-live-verified");
    }
  });
});
