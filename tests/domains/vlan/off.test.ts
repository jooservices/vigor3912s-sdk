import { describe, expect, it } from "vitest";

import { vlanOff } from "../../../src/domains/vlan.js";
import { parseOff } from "../../../src/internal/parsers/vlan/off.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.off -- vlan off (rawLine 9384)", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(vlanOff.buildFrames(undefined));

    expect(frame.command).toBe("vlan off");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOff(" VLAN is Disable!\n")).toEqual({ raw: "VLAN is Disable!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanOff, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanOff.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "VLAN is Disable!");

    expect(stdout).toBe("VLAN is Disable!");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanOff.parse([{ stdout: "VLAN is Disable!", stderr: "" }])).toEqual(
      parseOff("VLAN is Disable!"),
    );
  });
});
