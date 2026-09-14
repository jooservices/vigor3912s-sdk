import { describe, expect, it } from "vitest";

import { vlanPri } from "../../../src/domains/vlan.js";
import { parsePri } from "../../../src/internal/parsers/vlan/pri.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TEXT = "VLAN1: Priority=2\n";

describe("cli.vlan.pri", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vlanPri.buildFrames({ vlanId: 1, priority: 2 }));

    expect(frame.command).toBe("vlan pri 1 2");
    expect(() => vlanPri.buildFrames({ vlanId: 8, priority: 2 })).toThrow(/vlanId/);
    expect(() => vlanPri.buildFrames({ vlanId: 1, priority: 8 })).toThrow(/priority/);
  });

  it("parses acknowledgement text as raw output (synthetic sample)", () => {
    expect(parsePri(SAMPLE_TEXT)).toEqual({
      raw: "VLAN1: Priority=2",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vlanPri, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(vlanPri.buildFrames({ vlanId: 1, priority: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "VLAN1: Priority=2");

    expect(stdout).toBe("VLAN1: Priority=2");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(vlanPri.parse([{ stdout: SAMPLE_TEXT, stderr: "" }])).toEqual(parsePri(SAMPLE_TEXT));
  });
});
