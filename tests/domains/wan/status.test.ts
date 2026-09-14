import { describe, expect, it } from "vitest";

import { wanStatus } from "../../../src/domains/wan.js";
import { parseWanStatus } from "../../../src/internal/parsers/wan/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT = [
  "BWAN1: Offline, stall=N",
  " Mode: DHCP Client, Up Time=00:00:00",
  " IP=---, GW IP=---",
  " TX Packets=0, TX Rate(bps)=0, RX Packets=0, RX Rate(bps)=0",
  " Primary DNS=0.0.0.0, Secondary DNS=0.0.0.0",
  "",
  "BWAN3: Online, stall=Y",
  " Mode: PPPoE, Up Time=00:00:05",
  " IP=192.168.100.1, GW IP=192.168.100.254",
  " TX Packets=72581, TX Rate(bps)=100, RX Packets=112651, RX Rate(bps)=200",
  " Primary DNS=8.8.8.8, Secondary DNS=8.8.4.4",
  "",
].join("\n");

describe("cli.wan.status -- wan status (read)", () => {
  it("builds the documented no-argument frame", () => {
    const frames = wanStatus.buildFrames(undefined);

    expect(frames).toHaveLength(1);
    expect(firstFrame(frames).command).toBe("wan status");
  });

  it("parses the documented per-WAN status blocks (synthetic sample)", () => {
    const report = parseWanStatus(SAMPLE_STATUS_TEXT);

    expect(report.interfaces).toEqual([
      {
        interfaceLabel: "WAN1",
        online: false,
        stall: false,
        mode: "DHCP Client",
        upTime: "00:00:00",
        ipAddress: "---",
        gatewayIp: "---",
        txPackets: 0,
        txRateBps: 0,
        rxPackets: 0,
        rxRateBps: 0,
        primaryDns: "0.0.0.0",
        secondaryDns: "0.0.0.0",
      },
      {
        interfaceLabel: "WAN3",
        online: true,
        stall: true,
        mode: "PPPoE",
        upTime: "00:00:05",
        ipAddress: "192.168.100.1",
        gatewayIp: "192.168.100.254",
        txPackets: 72581,
        txRateBps: 100,
        rxPackets: 112651,
        rxRateBps: 200,
        primaryDns: "8.8.8.8",
        secondaryDns: "8.8.4.4",
      },
    ]);
  });

  it("returns no interfaces for text that doesn't match the documented shape", () => {
    expect(parseWanStatus("not a status block")).toEqual({ interfaces: [] });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(wanStatus, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(wanStatus.buildFrames(undefined)).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);

    expect(stdout).toBe(SAMPLE_STATUS_TEXT);
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    expect(wanStatus.parse([{ stdout: SAMPLE_STATUS_TEXT, stderr: "" }])).toEqual(
      parseWanStatus(SAMPLE_STATUS_TEXT),
    );
  });
});
