import { describe, expect, it } from "vitest";

import { vlanStatus } from "../../../src/domains/vlan.js";
import { parseVlanStatus } from "../../../src/internal/parsers/vlan/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT = [
  "VLAN  is Enable :",
  "---------------------------------------------------------------------",
  "VLAN Enable VID  Pri   p1 p2 p3 p4 p5 p6 p7 p8 p9 p10 p11 p12  subnet",
  "---------------------------------------------------------------------",
  " 0     OFF    0   0                                               1:LAN1",
  " 3     ON     10  2       V     V                                1:LAN1",
  "--- MORE ---   ['q': Quit, 'Enter': New Lines, 'Space Bar': Next Page]",
  "",
].join("\n");

describe("cli.vlan.status -- vlan status (read, rawLine 9426)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vlanStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vlan status");
  });

  it("parses the documented VLAN status table (synthetic sample)", () => {
    const report = parseVlanStatus(SAMPLE_STATUS_TEXT);

    expect(report.vlanEnabled).toBe(true);
    expect(report.channels).toEqual([
      {
        channel: 0,
        enabled: false,
        vid: 0,
        priority: 0,
        ports: "",
        subnet: "1:LAN1",
      },
      {
        channel: 3,
        enabled: true,
        vid: 10,
        priority: 2,
        ports: "V     V",
        subnet: "1:LAN1",
      },
    ]);
  });

  it("returns no channels and disabled state for text that doesn't match the documented shape", () => {
    expect(parseVlanStatus("not a status block")).toEqual({
      vlanEnabled: false,
      channels: [],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vlanStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);
    const report = vlanStatus.parse([{ stdout, stderr: "" }]);

    expect(report.channels).toHaveLength(2);
    await expectClosedTransportFailure(command);
  });
});
