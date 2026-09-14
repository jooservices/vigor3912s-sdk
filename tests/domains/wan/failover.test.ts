import { describe, expect, it } from "vitest";

import { wanFailover } from "../../../src/domains/wan.js";
import { parseFailover } from "../../../src/internal/parsers/wan/failover.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.wan.failover -- wan failover off|show|on", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    const offFrame = firstFrame(wanFailover.buildFrames({ action: "off", index: 3 }));

    expect(offFrame.command).toBe("wan failover off 3");

    const showFrame = firstFrame(wanFailover.buildFrames({ action: "show", index: 2 }));

    expect(showFrame.command).toBe("wan failover show 2");

    const onFrame = firstFrame(
      wanFailover.buildFrames({
        action: "on",
        failoverWan: 2,
        disconnectActionEnabled: true,
        anyOrAllActionEnabled: false,
        mainWan: 4,
        downloadThresholdKbps: 50,
        uploadThresholdKbps: 20,
      }),
    );

    expect(onFrame.command).toBe("wan failover on 2 1 0 4 50 20");

    expect(() => wanFailover.buildFrames({ action: "off", index: 13 })).toThrow(/index/);
    expect(() =>
      wanFailover.buildFrames({
        action: "on",
        failoverWan: 8,
        disconnectActionEnabled: true,
        anyOrAllActionEnabled: false,
        mainWan: 4,
        downloadThresholdKbps: 50,
        uploadThresholdKbps: 20,
      }),
    ).toThrow(/failoverWan/);
    expect(() =>
      wanFailover.buildFrames({
        action: "on",
        failoverWan: 2,
        disconnectActionEnabled: true,
        anyOrAllActionEnabled: false,
        mainWan: 4,
        downloadThresholdKbps: -1,
        uploadThresholdKbps: 20,
      }),
    ).toThrow(/downloadThresholdKbps/);
  });

  it("parses the documented show output (synthetic sample)", () => {
    expect(parseFailover("  wan2 Active Mode : Failover\n")).toEqual({
      raw: "wan2 Active Mode : Failover",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(wanFailover, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanFailover.buildFrames({ action: "show", index: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "wan2 Active Mode : Failover");

    expect(stdout).toBe("wan2 Active Mode : Failover");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "  wan2 Active Mode : Failover\n";

    expect(wanFailover.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseFailover(sampleText),
    );
  });

  it("builds the 'on' variant's other disconnect/any-or-all flag combination", () => {
    const onFrame = firstFrame(
      wanFailover.buildFrames({
        action: "on",
        failoverWan: 2,
        disconnectActionEnabled: false,
        anyOrAllActionEnabled: true,
        mainWan: 4,
        downloadThresholdKbps: 50,
        uploadThresholdKbps: 20,
      }),
    );

    expect(onFrame.command).toBe("wan failover on 2 0 1 4 50 20");
  });
});
