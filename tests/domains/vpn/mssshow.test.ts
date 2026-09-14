import { describe, expect, it } from "vitest";

import { vpnMssShow } from "../../../src/domains/vpn.js";
import { parseMssShow } from "../../../src/internal/parsers/vpn/mssshow.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mss.show -- vpn mss show", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frames = vpnMssShow.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn mss show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMssShow("  VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400\n")).toEqual({
      raw: "VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnMssShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMssShow.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "  VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400\n",
    );

    expect(vpnMssShow.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
