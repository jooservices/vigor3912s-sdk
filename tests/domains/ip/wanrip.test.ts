import { describe, expect, it } from "vitest";

import { ipWanrip } from "../../../src/domains/ip.js";
import { parseWanrip } from "../../../src/internal/parsers/ip/wanrip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.wanrip -- ip wanrip", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipWanrip.buildFrames({ interfaceNumber: 5, enabled: true })).command).toBe(
      "ip wanrip 5 -e 1",
    );
    expect(firstFrame(ipWanrip.buildFrames({ interfaceNumber: 1, enabled: false })).command).toBe(
      "ip wanrip 1 -e 0",
    );

    expect(() => ipWanrip.buildFrames({ interfaceNumber: 0, enabled: true })).toThrow(
      /interfaceNumber/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseWanrip("WAN[5] Rip Protocol enable\n")).toEqual({
      raw: "WAN[5] Rip Protocol enable",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipWanrip, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipWanrip.buildFrames({ interfaceNumber: 5, enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "WAN[5] Rip Protocol enable\n");

    expect(stdout).toBe("WAN[5] Rip Protocol enable\n");

    expect(ipWanrip.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
