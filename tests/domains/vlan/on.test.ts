import { describe, expect, it } from "vitest";

import { vlanOn } from "../../../src/domains/vlan.js";
import { parseOn } from "../../../src/internal/parsers/vlan/on.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vlan.on -- vlan on (rawLine 9396)", () => {
  it("builds the documented no-argument frame", () => {
    const frame = firstFrame(vlanOn.buildFrames(undefined));

    expect(frame.command).toBe("vlan on");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOn(" VLAN is Enable!\n")).toEqual({ raw: "VLAN is Enable!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanOn, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanOn.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "VLAN is Enable!");

    expect(stdout).toBe("VLAN is Enable!");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanOn.parse([{ stdout: "VLAN is Enable!", stderr: "" }])).toEqual(
      parseOn("VLAN is Enable!"),
    );
  });
});
