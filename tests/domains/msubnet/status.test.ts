import { describe, expect, it } from "vitest";

import { msubnetStatus } from "../../../src/domains/msubnet.js";
import { parseMsubnetStatus } from "../../../src/internal/parsers/msubnet/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT =
  "% LAN2        Off: 0.0.0.0/0.0.0.0, PPP Start IP: 0.0.0.60\n" +
  "% DHCP server: Off\n" +
  "% Dhcp Gateway: 0.0.0.0, Start IP: 0.0.0.10, Pool Count: 50\n";

describe("cli.msubnet.status -- msubnet status", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetStatus.buildFrames({ lanIndex: 2 }));

    expect(frame.command).toBe("msubnet status 2");

    expect(() => msubnetStatus.buildFrames({ lanIndex: 1 })).toThrow(/lanIndex/);
    expect(() => msubnetStatus.buildFrames({ lanIndex: 101 })).toThrow(/lanIndex/);
  });

  it("parses the documented example output (synthetic sample)", () => {
    expect(parseMsubnetStatus(SAMPLE_STATUS_TEXT)).toEqual({
      interfaceLabel: "LAN2",
      subnetEnabled: false,
      ipAddress: "0.0.0.0",
      netmask: "0.0.0.0",
      pppStartIp: "0.0.0.60",
      dhcpServerEnabled: false,
      dhcpGatewayIp: "0.0.0.0",
      dhcpStartIp: "0.0.0.10",
      dhcpPoolCount: 50,
    });

    expect(parseMsubnetStatus("garbage")).toBeNull();
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(msubnetStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(msubnetStatus.buildFrames({ lanIndex: 2 })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);

    expect(stdout).toBe(SAMPLE_STATUS_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(msubnetStatus.parse([{ stdout: SAMPLE_STATUS_TEXT, stderr: "" }])).toEqual(
      parseMsubnetStatus(SAMPLE_STATUS_TEXT),
    );
  });
});
