import { describe, expect, it } from "vitest";

import { vpnPass2nat } from "../../../src/domains/vpn.js";
import { parsePass2nat } from "../../../src/internal/parsers/vpn/pass2nat.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.pass2nat -- vpn pass2nat <on|off>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vpnPass2nat.buildFrames({ state: "on" })).command).toBe("vpn pass2nat on");
    expect(firstFrame(vpnPass2nat.buildFrames({ state: "off" })).command).toBe("vpn pass2nat off");

    expect(() => vpnPass2nat.buildFrames({ state: "maybe" as "on" })).toThrow(/state/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePass2nat("% Packets would go through by NAT when VPN disconnect!!\n")).toEqual({
      raw: "% Packets would go through by NAT when VPN disconnect!!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnPass2nat, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnPass2nat.buildFrames({ state: "on" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Packets would go through by NAT when VPN disconnect!!\n",
    );

    expect(vpnPass2nat.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Packets would go through by NAT when VPN disconnect!!",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
