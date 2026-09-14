import { describe, expect, it } from "vitest";

import { vpnFromlanDisable } from "../../../src/domains/vpn.js";
import { parseFromlanDisable } from "../../../src/internal/parsers/vpn/fromlandisable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.fromlan.disable -- vpn fromlan disable", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frames = vpnFromlanDisable.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn fromlan disable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFromlanDisable(" vpn fromlan status : disable\n")).toEqual({
      raw: "vpn fromlan status : disable",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnFromlanDisable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnFromlanDisable.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      " vpn fromlan status : disable\n",
    );

    expect(vpnFromlanDisable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "vpn fromlan status : disable",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
