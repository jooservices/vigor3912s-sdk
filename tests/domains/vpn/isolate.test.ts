import { describe, expect, it } from "vitest";

import { vpnIsolate } from "../../../src/domains/vpn.js";
import { parseIsolate } from "../../../src/internal/parsers/vpn/isolate.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.isolate -- vpn isolate <on|off>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vpnIsolate.buildFrames({ state: "on" })).command).toBe("vpn isolate on");
    expect(firstFrame(vpnIsolate.buildFrames({ state: "off" })).command).toBe("vpn isolate off");

    expect(() => vpnIsolate.buildFrames({ state: "maybe" as "on" })).toThrow(/state/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseIsolate("% Isolate OK\n")).toEqual({ raw: "% Isolate OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnIsolate, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnIsolate.buildFrames({ state: "on" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Isolate OK\n");

    expect(vpnIsolate.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Isolate OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
