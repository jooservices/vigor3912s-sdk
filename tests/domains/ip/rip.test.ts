import { describe, expect, it } from "vitest";

import { ipRip } from "../../../src/domains/ip.js";
import { parseRip } from "../../../src/internal/parsers/ip/rip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.rip -- ip rip", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipRip.buildFrames({ mode: 0 })).command).toBe("ip rip 0");
    expect(firstFrame(ipRip.buildFrames({ mode: 1 })).command).toBe("ip rip 1");
    expect(firstFrame(ipRip.buildFrames({ mode: 2 })).command).toBe("ip rip 2");

    expect(() => ipRip.buildFrames({ mode: 3 as unknown as 0 })).toThrow(/mode/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseRip("%% Set RIP LAN1.\n")).toEqual({
      raw: "%% Set RIP LAN1.",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipRip, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipRip.buildFrames({ mode: 0 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "%% Set RIP LAN1.\n");

    expect(stdout).toBe("%% Set RIP LAN1.\n");

    expect(ipRip.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
