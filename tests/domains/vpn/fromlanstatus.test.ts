import { describe, expect, it } from "vitest";

import { vpnFromlanStatus } from "../../../src/domains/vpn.js";
import { parseFromlanStatus } from "../../../src/internal/parsers/vpn/fromlanstatus.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.fromlan.status -- vpn fromlan status", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frames = vpnFromlanStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn fromlan status");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseFromlanStatus(" vpn fromlan status : enable\n from lan :\n")).toEqual({
      raw: "vpn fromlan status : enable\n from lan :",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnFromlanStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnFromlanStatus.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      " vpn fromlan status : enable\n from lan :\n",
    );

    expect(vpnFromlanStatus.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "vpn fromlan status : enable\n from lan :",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
