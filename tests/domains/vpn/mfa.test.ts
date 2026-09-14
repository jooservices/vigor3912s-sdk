import { describe, expect, it } from "vitest";

import { vpnMfa } from "../../../src/domains/vpn.js";
import { parseMfa } from "../../../src/internal/parsers/vpn/mfa.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mfa -- vpn mfa bypass <duration>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMfa.buildFrames({ duration: "10H" }));

    expect(frame.command).toBe("vpn mfa bypass 10H");

    expect(() => vpnMfa.buildFrames({ duration: "10" })).toThrow(/duration/);
    expect(() => vpnMfa.buildFrames({ duration: "32D" })).toThrow(/duration/);
    expect(() => vpnMfa.buildFrames({ duration: "745H" })).toThrow(/duration/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMfa(" VPN 2FA will valid in 10 Hour(s).\n")).toEqual({
      raw: "VPN 2FA will valid in 10 Hour(s).",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMfa, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMfa.buildFrames({ duration: "10H" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      " VPN 2FA will valid in 10 Hour(s).\n",
    );

    expect(vpnMfa.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "VPN 2FA will valid in 10 Hour(s).",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
