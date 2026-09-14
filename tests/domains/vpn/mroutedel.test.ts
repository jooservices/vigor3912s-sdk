import { describe, expect, it } from "vitest";

import { vpnMrouteDel } from "../../../src/domains/vpn.js";
import { parseMrouteDel } from "../../../src/internal/parsers/vpn/mroutedel.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mroute.del -- vpn mroute <index> del <network>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMrouteDel.buildFrames({ index: 1, network: "192.168.5.0/24" }));

    expect(frame.command).toBe("vpn mroute 1 del 192.168.5.0/24");

    expect(() => vpnMrouteDel.buildFrames({ index: 0, network: "1.2.3.0/24" })).toThrow(/index/);
    expect(() => vpnMrouteDel.buildFrames({ index: 1, network: "" })).toThrow(/network/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMrouteDel("% Delete route 192.168.5.0/24 from profile 1\n")).toEqual({
      raw: "% Delete route 192.168.5.0/24 from profile 1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMrouteDel, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMrouteDel.buildFrames({ index: 1, network: "192.168.5.0/24" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Delete route 192.168.5.0/24 from profile 1\n",
    );

    expect(vpnMrouteDel.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Delete route 192.168.5.0/24 from profile 1",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
