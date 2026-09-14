import { describe, expect, it } from "vitest";

import { vpnMrouteAdd } from "../../../src/domains/vpn.js";
import { parseMrouteAdd } from "../../../src/internal/parsers/vpn/mrouteadd.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mroute.add -- vpn mroute <index> add <network>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMrouteAdd.buildFrames({ index: 1, network: "192.168.5.0/24" }));

    expect(frame.command).toBe("vpn mroute 1 add 192.168.5.0/24");

    expect(() => vpnMrouteAdd.buildFrames({ index: 0, network: "1.2.3.0/24" })).toThrow(/index/);
    expect(() => vpnMrouteAdd.buildFrames({ index: 1, network: "" })).toThrow(/network/);
    expect(() => vpnMrouteAdd.buildFrames({ index: 1, network: "x;rm" })).toThrow(/network/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMrouteAdd("% Add new route 192.168.5.0/24 to profile 1\n")).toEqual({
      raw: "% Add new route 192.168.5.0/24 to profile 1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMrouteAdd, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMrouteAdd.buildFrames({ index: 1, network: "192.168.5.0/24" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Add new route 192.168.5.0/24 to profile 1\n",
    );

    expect(vpnMrouteAdd.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Add new route 192.168.5.0/24 to profile 1",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
