import { describe, expect, it } from "vitest";

import { vpnMrouteDelmsa } from "../../../src/domains/vpn.js";
import { parseMrouteDelmsa } from "../../../src/internal/parsers/vpn/mroutedelmsa.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mroute.delmsa -- vpn mroute <index> delmsa <local> <remote>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      vpnMrouteDelmsa.buildFrames({
        index: 1,
        localNetwork: "10.0.0.0/24",
        remoteNetwork: "10.0.1.0/24",
      }),
    );

    expect(frame.command).toBe("vpn mroute 1 delmsa 10.0.0.0/24 10.0.1.0/24");

    expect(() =>
      vpnMrouteDelmsa.buildFrames({ index: 501, localNetwork: "a", remoteNetwork: "b" }),
    ).toThrow(/index/);
    expect(() =>
      vpnMrouteDelmsa.buildFrames({ index: 1, localNetwork: "a;rm", remoteNetwork: "b" }),
    ).toThrow(/localNetwork/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMrouteDelmsa("% Delete MSA OK\n")).toEqual({ raw: "% Delete MSA OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMrouteDelmsa, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(
      vpnMrouteDelmsa.buildFrames({
        index: 1,
        localNetwork: "10.0.0.0/24",
        remoteNetwork: "10.0.1.0/24",
      }),
    );
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Delete MSA OK\n");

    expect(vpnMrouteDelmsa.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Delete MSA OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
