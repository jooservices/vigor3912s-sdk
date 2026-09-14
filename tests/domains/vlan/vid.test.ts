import { describe, expect, it } from "vitest";

import { vlanVid } from "../../../src/domains/vlan.js";
import { parseVid } from "../../../src/internal/parsers/vlan/vid.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.vid -- vlan vid n vid_no (rawLine 9537)", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanVid.buildFrames({ channel: 1, vid: 4095 }));

    expect(frame.command).toBe("vlan vid 1 4095");

    expect(() => vlanVid.buildFrames({ channel: 8, vid: 100 })).toThrow(/channel/);
    expect(() => vlanVid.buildFrames({ channel: 1, vid: 4096 })).toThrow(/vid/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseVid("VLAN1, vid=4095\n")).toEqual({ raw: "VLAN1, vid=4095" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanVid, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanVid.buildFrames({ channel: 1, vid: 4095 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "VLAN1, vid=4095");

    expect(stdout).toBe("VLAN1, vid=4095");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanVid.parse([{ stdout: "VLAN1, vid=4095", stderr: "" }])).toEqual(
      parseVid("VLAN1, vid=4095"),
    );
  });
});
