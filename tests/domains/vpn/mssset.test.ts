import { describe, expect, it } from "vitest";

import { vpnMssSet } from "../../../src/domains/vpn.js";
import { parseMssSet } from "../../../src/internal/parsers/vpn/mssset.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mss.set -- vpn mss set <type> <mss>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMssSet.buildFrames({ connectionType: 1, mss: 1400 }));

    expect(frame.command).toBe("vpn mss set 1 1400");

    expect(() => vpnMssSet.buildFrames({ connectionType: 8 as 1, mss: 1400 })).toThrow(
      /connectionType/,
    );
    expect(() => vpnMssSet.buildFrames({ connectionType: 1, mss: 511 })).toThrow(/mss/);
    expect(() => vpnMssSet.buildFrames({ connectionType: 1, mss: 1413 })).toThrow(/mss/);
    expect(() => vpnMssSet.buildFrames({ connectionType: 6, mss: 1361 })).toThrow(/mss/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMssSet("% VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400\n")).toEqual({
      raw: "% VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMssSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMssSet.buildFrames({ connectionType: 1, mss: 1400 }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400\n",
    );

    expect(vpnMssSet.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% VPN TCP maximum segment size (MSS) :\n  PPTP  = 1400",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
