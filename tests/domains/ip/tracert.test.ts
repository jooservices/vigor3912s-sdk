import { describe, expect, it } from "vitest";

import { ipTracert } from "../../../src/domains/ip.js";
import { parseTracert } from "../../../src/internal/parsers/ip/tracert.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

const SAMPLE_TRACERT_TEXT = [
  "Traceroute to 22.128.2.62, 30 hops max",
  "1 172.16.3.7 10ms",
  "2 172.16.1.2 10ms",
  "3 Request Time out.",
].join("\n");

describe("cli.ip.tracert -- ip tracert (read)", () => {
  it("builds the documented frame incl. optional WAN/protocol suffix and rejects invalid input", () => {
    const frame = firstFrame(ipTracert.buildFrames({ targetIp: "22.128.2.62" }));
    expect(frame.command).toBe("ip tracert 22.128.2.62");

    const frameWithWan = firstFrame(
      ipTracert.buildFrames({ targetIp: "22.128.2.62", wanInterface: "WAN1" }),
    );
    expect(frameWithWan.command).toBe("ip tracert 22.128.2.62 WAN1");

    const frameWithProtocol = firstFrame(
      ipTracert.buildFrames({
        targetIp: "22.128.2.62",
        wanInterface: "WAN1",
        protocol: "Udp",
      }),
    );
    expect(frameWithProtocol.command).toBe("ip tracert 22.128.2.62 WAN1 Udp");

    expect(() => ipTracert.buildFrames({ targetIp: "not-an-ip" })).toThrow(/targetIp/);
    expect(() =>
      ipTracert.buildFrames({
        targetIp: "22.128.2.62",
        wanInterface: "WAN13" as unknown as "WAN1",
      }),
    ).toThrow(/wanInterface/);
    expect(() => ipTracert.buildFrames({ targetIp: "22.128.2.62", protocol: "Udp" })).toThrow(
      /protocol requires wanInterface/,
    );
  });

  it("carries the 60s diagnostic-exception executionOverride ceiling on the descriptor", () => {
    expect(ipTracert.executionOverride).toEqual({ commandTimeoutMs: 60_000 });
  });

  it("parses the documented traceroute output (synthetic sample)", () => {
    expect(parseTracert(SAMPLE_TRACERT_TEXT)).toEqual({
      target: "22.128.2.62",
      maxHops: 30,
      hops: [
        { hop: 1, address: "172.16.3.7", timeMs: 10, timedOut: false },
        { hop: 2, address: "172.16.1.2", timeMs: 10, timedOut: false },
        { hop: 3, address: null, timeMs: null, timedOut: true },
      ],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipTracert, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipTracert.buildFrames({ targetIp: "22.128.2.62" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_TRACERT_TEXT);

    expect(stdout).toBe(SAMPLE_TRACERT_TEXT);

    expect(ipTracert.parse([exchange(stdout)])).toEqual({
      target: "22.128.2.62",
      maxHops: 30,
      hops: [
        { hop: 1, address: "172.16.3.7", timeMs: 10, timedOut: false },
        { hop: 2, address: "172.16.1.2", timeMs: 10, timedOut: false },
        { hop: 3, address: null, timeMs: null, timedOut: true },
      ],
    });
    await expectClosedTransportFailure(command);
  });
});
