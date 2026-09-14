import { describe, expect, it } from "vitest";

import { vigbrgSet } from "../../../src/domains/vigbrg.js";
import { parseSet } from "../../../src/internal/parsers/vigbrg/set.js";
import { exchange } from "../../support/fake-transport.js";
import { expectManifestLinkage, firstFrame } from "./support.js";
import { dispatchThroughFakeTransport, expectClosedTransportFailure } from "./test-helpers.js";

describe("cli.vigbrg.set -- vigbrg set (write)", () => {
  it("builds the documented frame with required flags and rejects invalid input", () => {
    const frame = firstFrame(
      vigbrgSet.buildFrames({
        ipVersion: 4,
        wanIndex: 10,
        lanIndex: 100,
        bridgeEnabled: true,
      }),
    );

    expect(frame.command).toBe("vigbrg set -v 4 -w 10 -l 100 -e 1");

    expect(() =>
      vigbrgSet.buildFrames({
        ipVersion: 5 as unknown as 4 | 6,
        wanIndex: 1,
        lanIndex: 1,
        bridgeEnabled: true,
      }),
    ).toThrow(/ipVersion/);

    expect(() =>
      vigbrgSet.buildFrames({
        ipVersion: 4,
        wanIndex: 0,
        lanIndex: 1,
        bridgeEnabled: true,
      }),
    ).toThrow(/wanIndex/);

    expect(() =>
      vigbrgSet.buildFrames({
        ipVersion: 4,
        wanIndex: 1,
        lanIndex: 101,
        bridgeEnabled: true,
      }),
    ).toThrow(/lanIndex/);
  });

  it("appends the optional firewall flag when provided", () => {
    const frame = firstFrame(
      vigbrgSet.buildFrames({
        ipVersion: 6,
        wanIndex: 1,
        lanIndex: 1,
        bridgeEnabled: false,
        firewallEnabled: true,
      }),
    );

    expect(frame.command).toBe("vigbrg set -v 6 -w 1 -l 1 -e 0 -f 1");
  });

  it("appends the optional firewall flag as 0 when explicitly disabled", () => {
    const frame = firstFrame(
      vigbrgSet.buildFrames({
        ipVersion: 6,
        wanIndex: 1,
        lanIndex: 1,
        bridgeEnabled: false,
        firewallEnabled: false,
      }),
    );

    expect(frame.command).toBe("vigbrg set -v 6 -w 1 -l 1 -e 0 -f 0");
  });

  it("rejects a non-integer wanIndex", () => {
    expect(() =>
      vigbrgSet.buildFrames({
        ipVersion: 4,
        wanIndex: 1.5,
        lanIndex: 1,
        bridgeEnabled: true,
      }),
    ).toThrow(/integer/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseSet("[WAN10] IPv4 bridge is enable. Set subnet[LAN100]\n")).toEqual({
      raw: "[WAN10] IPv4 bridge is enable. Set subnet[LAN100]",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vigbrgSet, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      vigbrgSet.buildFrames({
        ipVersion: 4,
        wanIndex: 10,
        lanIndex: 100,
        bridgeEnabled: true,
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "[WAN10] IPv4 bridge is enable. Set subnet[LAN100]\n",
    );

    expect(stdout).toBe("[WAN10] IPv4 bridge is enable. Set subnet[LAN100]\n");
    await expectClosedTransportFailure(command);
  });

  it("wires the operation's parse through firstExchangeText to parseSet", () => {
    const sample = "[WAN10] IPv4 bridge is enable. Set subnet[LAN100]\n";

    expect(vigbrgSet.parse([exchange(sample)])).toEqual(parseSet(sample));
  });

  it("falls back to an empty string when no exchange was captured", () => {
    expect(vigbrgSet.parse([])).toEqual(parseSet(""));
  });
});
