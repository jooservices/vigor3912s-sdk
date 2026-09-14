import { describe, expect, it } from "vitest";

import { vpnMssDefault } from "../../../src/domains/vpn.js";
import { parseMssDefault } from "../../../src/internal/parsers/vpn/mssdefault.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mss.default -- vpn mss default", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frames = vpnMssDefault.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("vpn mss default");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMssDefault("% MSS reset to default\n")).toEqual({ raw: "% MSS reset to default" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMssDefault, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMssDefault.buildFrames(undefined));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% MSS reset to default\n",
    );

    expect(vpnMssDefault.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% MSS reset to default",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
