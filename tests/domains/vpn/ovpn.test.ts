import { describe, expect, it } from "vitest";

import { vpnOvpn } from "../../../src/domains/vpn.js";
import { parseOvpn } from "../../../src/internal/parsers/vpn/ovpn.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.ovpn -- vpn ovpn <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnOvpn.buildFrames({ param: "mode 1" }));

    expect(frame.command).toBe("vpn ovpn mode 1");

    expect(() => vpnOvpn.buildFrames({ param: "" })).toThrow(/param/);
    expect(() => vpnOvpn.buildFrames({ param: "mode 1; rm -rf" })).toThrow(/param/);
    expect(() => vpnOvpn.buildFrames({ param: "a".repeat(256) })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseOvpn("Enable openvpn\n")).toEqual({ raw: "Enable openvpn" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnOvpn, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnOvpn.buildFrames({ param: "mode 1" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "Enable openvpn\n");

    expect(vpnOvpn.parse([{ stdout, stderr: "" }])).toEqual({ raw: "Enable openvpn" });

    await expectClosedTransportFailure(frame.command);
  });
});
