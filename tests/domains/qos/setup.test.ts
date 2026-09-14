import { describe, expect, it } from "vitest";

import { qosSetup } from "../../../src/domains/qos.js";
import { parseQosSetup } from "../../../src/internal/parsers/qos/setup.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.qos.setup -- qos setup", () => {
  it("builds the documented frame and rejects invalid/empty input", () => {
    const frame = firstFrame(
      qosSetup.buildFrames({
        mode: 3,
        inboundBandwidthKbps: 9500,
        outboundBandwidthKbps: 8500,
        classRatio: { classIndex: 3, ratioPercent: 20 },
        udpBandwidthControlEnabled: true,
        udpBandwidthLimitRatioPercent: 50,
        outboundTcpAckPrioritizeEnabled: true,
      }),
    );

    expect(frame.command).toBe("qos setup -m 3 -i 9500 -o 8500 -r 3:20 -u 1 -p 50 -t 1");

    expect(() => qosSetup.buildFrames({})).toThrow(/at least one/i);
    expect(() => qosSetup.buildFrames({ wanInterface: 0 })).toThrow(/wanInterface/);
    expect(() => qosSetup.buildFrames({ wanInterface: 13 })).toThrow(/wanInterface/);
    expect(() => qosSetup.buildFrames({ wanInterface: 1.5 })).toThrow(/must be an integer/);
    expect(() => qosSetup.buildFrames({ mode: 4 as never })).toThrow(/mode/);
    expect(() => qosSetup.buildFrames({ inboundBandwidthKbps: 0 })).toThrow(/inboundBandwidthKbps/);
    expect(() => qosSetup.buildFrames({ outboundBandwidthKbps: 100_001 })).toThrow(
      /outboundBandwidthKbps/,
    );
    expect(() => qosSetup.buildFrames({ classRatio: { classIndex: 4, ratioPercent: 10 } })).toThrow(
      /classRatio.classIndex/,
    );
    expect(() =>
      qosSetup.buildFrames({ classRatio: { classIndex: 1, ratioPercent: 101 } }),
    ).toThrow(/classRatio.ratioPercent/);
    expect(() => qosSetup.buildFrames({ udpBandwidthLimitRatioPercent: -1 })).toThrow(
      /udpBandwidthLimitRatioPercent/,
    );
    expect(() => qosSetup.buildFrames({ voipBandwidthAdjustMode: 2 as never })).toThrow(
      /voipBandwidthAdjustMode/,
    );

    const showAllFrame = firstFrame(qosSetup.buildFrames({ showAll: true, wanInterface: 2 }));
    expect(showAllFrame.command).toBe("qos setup -W 2 -V");

    const disabledFlagsFrame = firstFrame(
      qosSetup.buildFrames({
        udpBandwidthControlEnabled: false,
        outboundTcpAckPrioritizeEnabled: false,
      }),
    );
    expect(disabledFlagsFrame.command).toBe("qos setup -u 0 -t 0");

    const voipAdjustFrame = firstFrame(
      qosSetup.buildFrames({
        minNonVoipInboundBandwidthKbps: 100,
        minNonVoipOutboundBandwidthKbps: 200,
      }),
    );
    expect(voipAdjustFrame.command).toBe("qos setup -I 100 -O 200");

    expect(() => qosSetup.buildFrames({ minNonVoipInboundBandwidthKbps: 0 })).toThrow(
      /minNonVoipInboundBandwidthKbps/,
    );
    expect(() => qosSetup.buildFrames({ minNonVoipOutboundBandwidthKbps: -1 })).toThrow(
      /minNonVoipOutboundBandwidthKbps/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    const sample = [
      " WAN1 QOS mode is both",
      " inbound bandwidth set to 9500",
      " outbound bandwidth set to 8500",
      " WAN1 class 3 ratio set to 20",
      " WAN1 udp bandwidth control set to enable",
      " WAN1 udp bandwidth limit ratio set to 50",
      " WAN1 Outbound TCP ACK Prioritizel set to enable",
      "QoS WAN1 set complete; restart QoS",
    ].join("\n");

    expect(parseQosSetup(sample)).toEqual({ raw: sample.trim() });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(qosSetup, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(qosSetup.buildFrames({ mode: 3 })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "QoS WAN1 set complete; restart QoS",
    );

    expect(qosSetup.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "QoS WAN1 set complete; restart QoS",
    });

    await expectClosedTransportFailure(command);
  });

  it("parses an empty raw string when no exchange is present (defensive fallback)", () => {
    expect(qosSetup.parse([])).toEqual({ raw: "" });
  });
});
