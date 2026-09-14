import { describe, expect, it } from "vitest";

import { vigbrgWanStatus } from "../../../src/domains/vigbrg.js";
import { parseWanStatus } from "../../../src/internal/parsers/vigbrg/wanstatus.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_WANSTATUS_TEXT = [
  "Vigor Bridge: Stop",
  "WAN mac table:",
  "Index   MAC Address             Stamp Time      PVC     VLan Port",
  "1   00:11:22:33:44:55   00:00:12   1   p1",
  "",
].join("\n");

describe("cli.vigbrg.wanstatus -- vigbrg wanstatus (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vigbrgWanStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vigbrg wanstatus");
  });

  it("parses the documented bridge state and WAN mac table (synthetic sample)", () => {
    expect(parseWanStatus(SAMPLE_WANSTATUS_TEXT)).toEqual({
      bridgeState: "Stop",
      entries: [
        {
          index: "1",
          macAddress: "00:11:22:33:44:55",
          stampTime: "00:00:12",
          pvc: "1",
          vlanPort: "p1",
        },
      ],
    });
  });

  it("returns an empty table for text that doesn't match the documented shape", () => {
    expect(parseWanStatus("not a wanstatus block")).toEqual({
      bridgeState: "",
      entries: [],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vigbrgWanStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vigbrgWanStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_WANSTATUS_TEXT);

    expect(stdout).toBe(SAMPLE_WANSTATUS_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseWanStatus", () => {
    expect(vigbrgWanStatus.parse([exchange(SAMPLE_WANSTATUS_TEXT)])).toEqual(
      parseWanStatus(SAMPLE_WANSTATUS_TEXT),
    );
  });
});
