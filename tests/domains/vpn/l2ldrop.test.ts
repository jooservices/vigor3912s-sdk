import { describe, expect, it } from "vitest";

import { vpnL2lDrop } from "../../../src/domains/vpn.js";
import { parseL2lDrop } from "../../../src/internal/parsers/vpn/l2ldrop.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.l2ldrop -- vpn l2lDrop [param]", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vpnL2lDrop.buildFrames({})).command).toBe("vpn l2lDrop");
    expect(firstFrame(vpnL2lDrop.buildFrames({ param: "l2lidx 1" })).command).toBe(
      "vpn l2lDrop l2lidx 1",
    );

    expect(() => vpnL2lDrop.buildFrames({ param: "" })).toThrow(/param/);
    expect(() => vpnL2lDrop.buildFrames({ param: "x;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseL2lDrop("% Drop all VPN\n")).toEqual({ raw: "% Drop all VPN" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnL2lDrop, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnL2lDrop.buildFrames({}));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Drop all VPN\n");

    expect(vpnL2lDrop.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Drop all VPN" });

    await expectClosedTransportFailure(frame.command);
  });
});
