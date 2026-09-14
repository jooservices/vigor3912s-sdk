import { describe, expect, it } from "vitest";

import { vpnSetup } from "../../../src/domains/vpn.js";
import { parseSetup } from "../../../src/internal/parsers/vpn/setup.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.setup -- vpn setup <index> <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(
      vpnSetup.buildFrames({
        index: 1,
        param: "name1 pptp_out 1.2.3.4 vigor 1234 192.168.1.0 255.255.255.0",
      }),
    );

    expect(frame.command).toBe(
      "vpn setup 1 name1 pptp_out 1.2.3.4 vigor 1234 192.168.1.0 255.255.255.0",
    );

    expect(() => vpnSetup.buildFrames({ index: 0, param: "x" })).toThrow(/index/);
    expect(() => vpnSetup.buildFrames({ index: 129, param: "x" })).toThrow(/index/);
    expect(() => vpnSetup.buildFrames({ index: 1, param: "" })).toThrow(/param/);
    expect(() => vpnSetup.buildFrames({ index: 1, param: "x;rm -rf" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSetup("% Set OK\n")).toEqual({ raw: "% Set OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnSetup, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(
      vpnSetup.buildFrames({
        index: 1,
        param: "name1 ipsec_out 1.2.3.4 1234 192.168.1.0 255.255.255.0",
      }),
    );
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Set OK\n");

    expect(vpnSetup.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Set OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
