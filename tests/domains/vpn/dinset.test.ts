import { describe, expect, it } from "vitest";

import { vpnDinset } from "../../../src/domains/vpn.js";
import { parseDinset } from "../../../src/internal/parsers/vpn/dinset.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.dinset -- vpn dinset <index> [param]", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vpnDinset.buildFrames({ index: 1 })).command).toBe("vpn dinset 1");
    expect(firstFrame(vpnDinset.buildFrames({ index: 1, param: "on" })).command).toBe(
      "vpn dinset 1 on",
    );

    expect(() => vpnDinset.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => vpnDinset.buildFrames({ index: 1, param: "" })).toThrow(/param/);
    expect(() => vpnDinset.buildFrames({ index: 1, param: "x;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDinset("% Profile enabled\n")).toEqual({ raw: "% Profile enabled" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnDinset, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnDinset.buildFrames({ index: 1, param: "on" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Profile enabled\n");

    expect(vpnDinset.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Profile enabled" });

    await expectClosedTransportFailure(frame.command);
  });
});
