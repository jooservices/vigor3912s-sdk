import { describe, expect, it } from "vitest";

import { ipSpoofdef } from "../../../src/domains/ip.js";
import { parseSpoofdef } from "../../../src/internal/parsers/ip/spoofdef.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.spoofdef -- ip spoofdef", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipSpoofdef.buildFrames({ side: "WAN", enabled: false })).command).toBe(
      "ip spoofdef WAN 0",
    );
    expect(firstFrame(ipSpoofdef.buildFrames({ side: "LAN", enabled: true })).command).toBe(
      "ip spoofdef LAN 1",
    );

    expect(() =>
      ipSpoofdef.buildFrames({ side: "DMZ" as unknown as "WAN", enabled: true }),
    ).toThrow(/side/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSpoofdef("% Setting saved:\n")).toEqual({
      raw: "% Setting saved:",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipSpoofdef, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipSpoofdef.buildFrames({ side: "WAN", enabled: false })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Setting saved:\n");

    expect(stdout).toBe("% Setting saved:\n");

    expect(ipSpoofdef.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
