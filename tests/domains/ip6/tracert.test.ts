import { describe, expect, it } from "vitest";

import { ip6Tracert } from "../../../src/domains/ip6.js";
import { parseTracert } from "../../../src/internal/parsers/ip6/tracert.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_TRACERT_TEXT = [
  "traceroute to 2001:db8::1234, 30 hops max through protocol ICMP",
  "  1 2001:db8::1         10 ms",
  "  2 2001:db8::1234      20 ms",
  "Trace complete.",
].join("\n");

describe("cli.ip6.tracert -- ip6 tracert (read)", () => {
  it("builds the documented frame and rejects malformed/non-IPv6 targets", () => {
    const frame = firstFrame(ip6Tracert.buildFrames({ target: "2001:db8::1234" }));

    expect(frame.command).toBe("ip6 tracert 2001:db8::1234");

    const withInterface = firstFrame(
      ip6Tracert.buildFrames({ target: "2001:db8::1234", interfaceLabel: "LAN1" }),
    );

    expect(withInterface.command).toBe("ip6 tracert 2001:db8::1234 LAN1");

    // Reject a bare IPv4 address (no colons at all).
    expect(() => ip6Tracert.buildFrames({ target: "10.0.0.1" })).toThrow(/IPv6/);

    // Reject malformed IPv6 syntax (more than one "::" compression).
    expect(() => ip6Tracert.buildFrames({ target: "fe80::1::2" })).toThrow(/IPv6/);

    // Reject an unsupported interface label.
    expect(() =>
      ip6Tracert.buildFrames({ target: "2001:db8::1234", interfaceLabel: "WAN11" }),
    ).toThrow(/interfaceLabel/);
  });

  it("parses the documented traceroute transcript (synthetic sample)", () => {
    expect(parseTracert(SAMPLE_TRACERT_TEXT)).toEqual({ raw: SAMPLE_TRACERT_TEXT.trim() });
  });

  it("links to the capability manifest as a read operation with the 60s diagnostic override", () => {
    expectManifestLinkage(ip6Tracert, "read");

    expect(ip6Tracert.executionOverride).toEqual({ commandTimeoutMs: 60_000 });
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Tracert.buildFrames({ target: "2001:db8::1234" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TRACERT_TEXT);

    expect(ip6Tracert.parse([exchange(stdout)])).toEqual({ raw: SAMPLE_TRACERT_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
