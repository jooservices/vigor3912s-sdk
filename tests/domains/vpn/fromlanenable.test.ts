import { describe, expect, it } from "vitest";

import { vpnFromlanEnable } from "../../../src/domains/vpn.js";
import { parseFromlanEnable } from "../../../src/internal/parsers/vpn/fromlanenable.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.fromlan.enable -- vpn fromlan enable", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frames = vpnFromlanEnable.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn fromlan enable");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFromlanEnable(" vpn fromlan status : enable\n")).toEqual({
      raw: "vpn fromlan status : enable",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnFromlanEnable, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnFromlanEnable.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      " vpn fromlan status : enable\n",
    );

    expect(vpnFromlanEnable.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "vpn fromlan status : enable",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
