import { describe, expect, it } from "vitest";

import { tacacsplusView } from "../../../src/domains/tacacsplus.js";
import { parseView } from "../../../src/internal/parsers/tacacsplus/view.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_VIEW_TEXT = [
  "External TACACS+ is enabled",
  "------------------------------------",
  "Primary Server:",
  "Server IP Address: 0.0.0.0",
  "Port:49",
  "Type:ASCII",
  "------------------------------------",
  "Secondary Server:",
  "Server IP Address: 192.168.1.59",
  "Port:49",
  "Type:ASCII",
  "",
].join("\n");

describe("cli.tacacsplus.view -- tacacsplus view (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = tacacsplusView.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("tacacsplus view");
  });

  it("parses the documented status blocks (synthetic sample)", () => {
    expect(parseView(SAMPLE_VIEW_TEXT)).toEqual({
      enabled: true,
      primaryServer: { ipAddress: "0.0.0.0", port: 49, type: "ASCII" },
      secondaryServer: { ipAddress: "192.168.1.59", port: 49, type: "ASCII" },
    });
  });

  it("returns a null port for a server block with a non-numeric port (unconfigured secondary server)", () => {
    const textWithBlankSecondaryPort = [
      "External TACACS+ is disabled",
      "------------------------------------",
      "Primary Server:",
      "Server IP Address: 0.0.0.0",
      "Port:49",
      "Type:ASCII",
      "------------------------------------",
      "Secondary Server:",
      "Server IP Address: 0.0.0.0",
      "Port:",
      "Type:ASCII",
      "",
    ].join("\n");

    expect(parseView(textWithBlankSecondaryPort).secondaryServer).toEqual({
      ipAddress: "0.0.0.0",
      port: null,
      type: "ASCII",
    });
  });

  it("returns null fields for text that doesn't match the documented shape", () => {
    expect(parseView("not a tacacsplus view block")).toEqual({
      enabled: null,
      primaryServer: null,
      secondaryServer: null,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(tacacsplusView, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(tacacsplusView.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_VIEW_TEXT);
    const report = tacacsplusView.parse([{ stdout, stderr: "" }]);

    expect(report.enabled).toBe(true);

    await expectClosedTransportFailure(command);
  });
});
