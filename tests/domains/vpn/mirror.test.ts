import { describe, expect, it } from "vitest";

import { vpnMirror } from "../../../src/domains/vpn.js";
import { parseMirror } from "../../../src/internal/parsers/vpn/mirror.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mirror -- vpn mirror <l2l|h2l> <index>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMirror.buildFrames({ scope: "l2l", index: 1 }));

    expect(frame.command).toBe("vpn mirror l2l 1");

    expect(() => vpnMirror.buildFrames({ scope: "x" as "l2l", index: 1 })).toThrow(/scope/);
    expect(() => vpnMirror.buildFrames({ scope: "l2l", index: 0 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMirror("% Mirror OK\n")).toEqual({ raw: "% Mirror OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnMirror, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMirror.buildFrames({ scope: "l2l", index: 1 }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Mirror OK\n");

    expect(vpnMirror.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Mirror OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
