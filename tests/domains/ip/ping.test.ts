import { describe, expect, it } from "vitest";

import { ipPing } from "../../../src/domains/ip.js";
import { parsePing } from "../../../src/internal/parsers/ip/ping.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

const SAMPLE_PING_TEXT = [
  "Pinging 172.16.3.229 with 64 bytes of Data:",
  "Receive reply from 172.16.3.229, time=0ms",
  "Receive reply from 172.16.3.229, time=1ms",
  "Packets: Sent = 5, Received = 5, Lost = 0 <0% loss>",
].join("\n");

describe("cli.ip.ping -- ip ping (read)", () => {
  it("builds the documented frame incl. optional WAN suffix and rejects invalid input", () => {
    const frame = firstFrame(ipPing.buildFrames({ targetIp: "172.16.3.229" }));
    expect(frame.command).toBe("ip ping 172.16.3.229");

    const frameWithWan = firstFrame(
      ipPing.buildFrames({ targetIp: "172.16.3.229", wanInterface: "WAN1" }),
    );
    expect(frameWithWan.command).toBe("ip ping 172.16.3.229 WAN1");

    expect(() => ipPing.buildFrames({ targetIp: "not-an-ip" })).toThrow(/targetIp/);
    expect(() => ipPing.buildFrames({ targetIp: "999.1.1.1" })).toThrow(/targetIp/);
    expect(() =>
      ipPing.buildFrames({
        targetIp: "172.16.3.229",
        wanInterface: "WAN9" as unknown as "WAN1",
      }),
    ).toThrow(/wanInterface/);
  });

  it("carries the 60s diagnostic-exception executionOverride ceiling on the descriptor", () => {
    expect(ipPing.executionOverride).toEqual({ commandTimeoutMs: 60_000 });
  });

  it("parses the documented ping output (synthetic sample)", () => {
    expect(parsePing(SAMPLE_PING_TEXT)).toEqual({
      target: "172.16.3.229",
      replies: [{ timeMs: 0 }, { timeMs: 1 }],
      packetsSent: 5,
      packetsReceived: 5,
      packetsLost: 0,
      lossPercent: 0,
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipPing, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipPing.buildFrames({ targetIp: "172.16.3.229" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_PING_TEXT);

    expect(stdout).toBe(SAMPLE_PING_TEXT);

    expect(ipPing.parse([exchange(stdout)])).toEqual({
      target: "172.16.3.229",
      replies: [{ timeMs: 0 }, { timeMs: 1 }],
      packetsSent: 5,
      packetsReceived: 5,
      packetsLost: 0,
      lossPercent: 0,
    });
    await expectClosedTransportFailure(command);
  });
});
