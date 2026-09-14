import { describe, expect, it } from "vitest";

import { ip6Ping } from "../../../src/domains/ip6.js";
import { parsePing } from "../../../src/internal/parsers/ip6/ping.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_PING_TEXT = [
  "Pinging 2001:db8::1234 with 64 bytes of Data:",
  "",
  "Receive reply from 2001:db8::1234, time=10ms",
  "Receive reply from 2001:db8::1234, time=10ms",
  "",
  "Packets: Sent = 2, Received = 2, Lost = 0 <0% loss>",
].join("\n");

describe("cli.ip6.ping -- ip6 ping (read)", () => {
  it("builds the documented frame and rejects malformed/non-IPv6 targets", () => {
    const frame = firstFrame(ip6Ping.buildFrames({ target: "2001:db8::1234" }));

    expect(frame.command).toBe("ip6 ping 2001:db8::1234");

    const withInterface = firstFrame(
      ip6Ping.buildFrames({ target: "2001:db8::1234", interfaceLabel: "WAN2" }),
    );

    expect(withInterface.command).toBe("ip6 ping 2001:db8::1234 WAN2");

    const withCounts = firstFrame(
      ip6Ping.buildFrames({
        target: "2001:db8::1234",
        interfaceLabel: "WAN2",
        sendCount: 5,
        dataSize: 64,
      }),
    );

    expect(withCounts.command).toBe("ip6 ping 2001:db8::1234 WAN2 5 64");

    // Reject a bare IPv4 address (no colons at all).
    expect(() => ip6Ping.buildFrames({ target: "192.168.1.1" })).toThrow(/IPv6/);

    // Reject malformed IPv6 syntax (more than one "::" compression).
    expect(() => ip6Ping.buildFrames({ target: "2001::db8::1234" })).toThrow(/IPv6/);

    // Reject an unsupported interface label.
    expect(() =>
      ip6Ping.buildFrames({ target: "2001:db8::1234", interfaceLabel: "LAN101" }),
    ).toThrow(/interfaceLabel/);

    // sendCount/dataSize must be provided together, and require interfaceLabel.
    expect(() =>
      ip6Ping.buildFrames({ target: "2001:db8::1234", sendCount: 5, dataSize: 64 }),
    ).toThrow(/interfaceLabel/);
    expect(() =>
      ip6Ping.buildFrames({ target: "2001:db8::1234", interfaceLabel: "WAN2", sendCount: 5 }),
    ).toThrow(/sendCount and dataSize/);
  });

  it("parses the documented ping transcript (synthetic sample)", () => {
    expect(parsePing(SAMPLE_PING_TEXT)).toEqual({ raw: SAMPLE_PING_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation with the 60s diagnostic override", () => {
    expectManifestLinkage(ip6Ping, "read");

    expect(ip6Ping.executionOverride).toEqual({ commandTimeoutMs: 60_000 });
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Ping.buildFrames({ target: "2001:db8::1234" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_PING_TEXT);

    expect(ip6Ping.parse([exchange(stdout)])).toEqual({ raw: SAMPLE_PING_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
