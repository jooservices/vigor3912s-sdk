import { describe, expect, it } from "vitest";

import { vlanSysvid } from "../../../src/domains/vlan.js";
import { parseSysvid } from "../../../src/internal/parsers/vlan/sysvid.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.sysvid -- vlan sysvid <show | n> (rawLine 9551)", () => {
  it("builds the documented frames for each mode and rejects invalid input", () => {
    const showFrame = firstFrame(vlanSysvid.buildFrames({ mode: "show" }));

    expect(showFrame.command).toBe("vlan sysvid show");

    const setFrame = firstFrame(vlanSysvid.buildFrames({ mode: "set", value: 300 }));

    expect(setFrame.command).toBe("vlan sysvid 300");

    expect(() => vlanSysvid.buildFrames({ mode: "set", value: 3829 })).toThrow(/value/);
    expect(() => vlanSysvid.buildFrames({ mode: "set", value: -1 })).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSysvid("% vlan sysvid range: 0-3828, reserved: 268\n")).toEqual({
      raw: "% vlan sysvid range: 0-3828, reserved: 268",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanSysvid, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanSysvid.buildFrames({ mode: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% vlan sysvid range: 0-3828, reserved: 268",
    );

    expect(stdout).toBe("% vlan sysvid range: 0-3828, reserved: 268");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% vlan sysvid range: 0-3828, reserved: 268";

    expect(vlanSysvid.parse([{ stdout: sampleText, stderr: "" }])).toEqual(parseSysvid(sampleText));
  });
});
