import { describe, expect, it } from "vitest";

import { vpnDialOut } from "../../../src/domains/vpn.js";
import { parseDialOut } from "../../../src/internal/parsers/vpn/dialout.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.dialout -- vpn dial_out <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnDialOut.buildFrames({ param: "dial 1" }));

    expect(frame.command).toBe("vpn dial_out dial 1");

    expect(() => vpnDialOut.buildFrames({ param: "" })).toThrow(/param/);
    expect(() => vpnDialOut.buildFrames({ param: "dial 1 & reboot" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDialOut(" Dialup L2L success\n")).toEqual({ raw: "Dialup L2L success" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnDialOut, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnDialOut.buildFrames({ param: "dial 1" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, " Dialup L2L success\n");

    expect(vpnDialOut.parse([{ stdout, stderr: "" }])).toEqual({ raw: "Dialup L2L success" });

    await expectClosedTransportFailure(frame.command);
  });
});
