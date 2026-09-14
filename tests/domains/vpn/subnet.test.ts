import { describe, expect, it } from "vitest";

import { vpnSubnet } from "../../../src/domains/vpn.js";
import { parseSubnet } from "../../../src/internal/parsers/vpn/subnet.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.subnet -- vpn subnet <index> <lan>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnSubnet.buildFrames({ index: 1, lan: 2 }));

    expect(frame.command).toBe("vpn subnet 1 2");

    expect(() => vpnSubnet.buildFrames({ index: 0, lan: 2 })).toThrow(/index/);
    expect(() => vpnSubnet.buildFrames({ index: 1, lan: 0 })).toThrow(/lan/);
    expect(() => vpnSubnet.buildFrames({ index: 1, lan: 101 })).toThrow(/lan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSubnet("% Set OK\n")).toEqual({ raw: "% Set OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnSubnet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnSubnet.buildFrames({ index: 1, lan: 2 }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Set OK\n");

    expect(vpnSubnet.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Set OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
