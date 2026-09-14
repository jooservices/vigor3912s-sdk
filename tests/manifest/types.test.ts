import { describe, expect, it } from "vitest";

import type {
  CapabilityEntry,
  CliCapabilityEntry,
  WebUiCapabilityEntry,
} from "../../src/manifest/types.js";

const cliEntry = {
  kind: "cli-command",
  id: "cli.sys.version",
  title: "sys version",
  citation: { corpus: "user-guide-part-viii", rawLine: 1, pdfPage: 1 },
  classification: "read",
  classificationBasis: "command-map-family",
  status: "documented",
  operationIds: [],
  command: "sys version",
  commandPath: ["sys", "version"],
  firmwareBasis: "user-guide-v4.3.5.1",
  verifiedOnFirmware: null,
} as const satisfies CliCapabilityEntry;

const cliAsUnion: CapabilityEntry = cliEntry;

const webUiEntry = {
  kind: "webui-page",
  id: "webui.nat.port-redirection",
  title: "NAT >> Port Redirection",
  citation: { corpus: "webui-capture", captureFile: "nat-port-redirection.html", indexRow: 1 },
  classification: "unknown",
  classificationBasis: "unclassified",
  status: "documented",
  operationIds: [],
  menuPath: "NAT >> Port Redirection",
  captureStatus: "ok",
  firmwareBasis: "live-capture-4.4.7_RC2",
} as const satisfies WebUiCapabilityEntry;

const webUiAsUnion: CapabilityEntry = webUiEntry;

describe("manifest schema types", () => {
  it("accepts a literal CLI capability entry", () => {
    expect(cliAsUnion.kind).toBe("cli-command");
  });

  it("accepts a literal WebUI capability entry", () => {
    expect(webUiAsUnion.kind).toBe("webui-page");
  });
});
