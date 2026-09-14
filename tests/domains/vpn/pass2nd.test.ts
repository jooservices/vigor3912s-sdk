import { describe, expect, it } from "vitest";

import { vpnPass2nd } from "../../../src/domains/vpn.js";
import { parsePass2nd } from "../../../src/internal/parsers/vpn/pass2nd.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.pass2nd -- vpn pass2nd <on|off>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vpnPass2nd.buildFrames({ state: "on" })).command).toBe("vpn pass2nd on");
    expect(firstFrame(vpnPass2nd.buildFrames({ state: "off" })).command).toBe("vpn pass2nd off");

    expect(() => vpnPass2nd.buildFrames({ state: "maybe" as "on" })).toThrow(/state/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parsePass2nd("% 2nd subnet is allowed to pass VPN tunnel!\n")).toEqual({
      raw: "% 2nd subnet is allowed to pass VPN tunnel!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnPass2nd, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnPass2nd.buildFrames({ state: "on" }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% 2nd subnet is allowed to pass VPN tunnel!\n",
    );

    expect(vpnPass2nd.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% 2nd subnet is allowed to pass VPN tunnel!",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
