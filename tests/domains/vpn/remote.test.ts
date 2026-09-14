import { describe, expect, it } from "vitest";

import { vpnRemote } from "../../../src/domains/vpn.js";
import { parseRemote } from "../../../src/internal/parsers/vpn/remote.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.remote -- vpn remote (bare, sibling-live-verified read query)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = vpnRemote.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn remote");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseRemote("Set PPTP VPN Service : On\n\nPlease restart the router!!\n")).toEqual({
      raw: "Set PPTP VPN Service : On\n\nPlease restart the router!!",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnRemote, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnRemote.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "Set PPTP VPN Service : On\n",
    );

    expect(vpnRemote.parse([{ stdout, stderr: "" }])).toEqual({ raw: "Set PPTP VPN Service : On" });

    await expectClosedTransportFailure(frame.command);
  });
});
