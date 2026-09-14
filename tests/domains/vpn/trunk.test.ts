import { describe, expect, it } from "vitest";

import { vpnTrunk } from "../../../src/domains/vpn.js";
import { parseTrunk } from "../../../src/internal/parsers/vpn/trunk.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.trunk -- vpn trunk <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnTrunk.buildFrames({ param: "show_usable" }));

    expect(frame.command).toBe("vpn trunk show_usable");

    expect(() => vpnTrunk.buildFrames({ param: "" })).toThrow(/param/);
    expect(() => vpnTrunk.buildFrames({ param: "x;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseTrunk("% Trunk OK\n")).toEqual({ raw: "% Trunk OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnTrunk, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnTrunk.buildFrames({ param: "show_usable" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Trunk OK\n");

    expect(vpnTrunk.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Trunk OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
