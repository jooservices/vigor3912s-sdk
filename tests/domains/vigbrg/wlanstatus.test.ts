import { describe, expect, it } from "vitest";

import { vigbrgWlanStatus } from "../../../src/domains/vigbrg.js";
import { parseWlanStatus } from "../../../src/internal/parsers/vigbrg/wlanstatus.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

const SAMPLE_WLANSTATUS_TEXT = [
  "Vigor Bridge: Running",
  "WAN mac table:",
  "Index  MAC Address        Stamp Time     PVC      VLan  Port",
  "1  AA:BB:CC:DD:EE:FF  00:01:23  2  p2",
  "",
].join("\n");

describe("cli.vigbrg.wlanstatus -- vigbrg wlanstatus (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vigbrgWlanStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vigbrg wlanstatus");
  });

  it("parses the documented bridge state and WAN mac table (synthetic sample)", () => {
    expect(parseWlanStatus(SAMPLE_WLANSTATUS_TEXT)).toEqual({
      bridgeState: "Running",
      entries: [
        {
          index: "1",
          macAddress: "AA:BB:CC:DD:EE:FF",
          stampTime: "00:01:23",
          pvc: "2",
          vlanPort: "p2",
        },
      ],
    });
  });

  it("returns an empty table for text that doesn't match the documented shape", () => {
    expect(parseWlanStatus("not a wlanstatus block")).toEqual({
      bridgeState: "",
      entries: [],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vigbrgWlanStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vigbrgWlanStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_WLANSTATUS_TEXT);

    expect(stdout).toBe(SAMPLE_WLANSTATUS_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseWlanStatus", () => {
    expect(vigbrgWlanStatus.parse([exchange(SAMPLE_WLANSTATUS_TEXT)])).toEqual(
      parseWlanStatus(SAMPLE_WLANSTATUS_TEXT),
    );
  });
});
