import { describe, expect, it } from "vitest";

import { vpnMrouteAddmsa } from "../../../src/domains/vpn.js";
import { parseMrouteAddmsa } from "../../../src/internal/parsers/vpn/mrouteaddmsa.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mroute.addmsa -- vpn mroute <index> addmsa <local> <remote>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      vpnMrouteAddmsa.buildFrames({
        index: 1,
        localNetwork: "10.0.0.0/24",
        remoteNetwork: "10.0.1.0/24",
      }),
    );

    expect(frame.command).toBe("vpn mroute 1 addmsa 10.0.0.0/24 10.0.1.0/24");

    expect(() =>
      vpnMrouteAddmsa.buildFrames({ index: 0, localNetwork: "a", remoteNetwork: "b" }),
    ).toThrow(/index/);
    expect(() =>
      vpnMrouteAddmsa.buildFrames({ index: 1, localNetwork: "", remoteNetwork: "b" }),
    ).toThrow(/localNetwork/);
    expect(() =>
      vpnMrouteAddmsa.buildFrames({ index: 1, localNetwork: "a", remoteNetwork: "b;rm" }),
    ).toThrow(/remoteNetwork/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMrouteAddmsa("% Add MSA OK\n")).toEqual({ raw: "% Add MSA OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMrouteAddmsa, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(
      vpnMrouteAddmsa.buildFrames({
        index: 1,
        localNetwork: "10.0.0.0/24",
        remoteNetwork: "10.0.1.0/24",
      }),
    );
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Add MSA OK\n");

    expect(vpnMrouteAddmsa.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Add MSA OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
