import { describe, expect, it } from "vitest";

import { ipBandwidth } from "../../../src/domains/ip.js";
import { parseBandwidth } from "../../../src/internal/parsers/ip/bandwidth.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.bandwidth -- ip bandwidth", () => {
  it("builds the documented frames per variant and rejects invalid input", () => {
    expect(firstFrame(ipBandwidth.buildFrames({ action: "state", enabled: true })).command).toBe(
      "ip bandwidth on",
    );
    expect(
      firstFrame(ipBandwidth.buildFrames({ action: "default", txRateKbps: 200, rxRateKbps: 800 }))
        .command,
    ).toBe("ip bandwidth default 200 800");
    expect(firstFrame(ipBandwidth.buildFrames({ action: "status" })).command).toBe(
      "ip bandwidth status",
    );
    expect(firstFrame(ipBandwidth.buildFrames({ action: "show" })).command).toBe(
      "ip bandwidth show",
    );
    expect(firstFrame(ipBandwidth.buildFrames({ action: "routing", enabled: false })).command).toBe(
      "ip bandwidth routing off",
    );
    expect(
      firstFrame(ipBandwidth.buildFrames({ action: "schedule", profiles: [1, 2, 3, 4] })).command,
    ).toBe("ip bandwidth schedule 1 2 3 4");
    expect(
      firstFrame(
        ipBandwidth.buildFrames({
          action: "addRange",
          ipStart: "192.168.1.50",
          ipEnd: "192.168.1.100",
          txRateKbps: 10,
          rxRateKbps: 60,
          shared: true,
        }),
      ).command,
    ).toBe("ip bandwidth add 192.168.1.50-192.168.1.100 10 60 1");
    expect(
      firstFrame(
        ipBandwidth.buildFrames({
          action: "delRange",
          ipStart: "192.168.1.50",
          ipEnd: "192.168.1.100",
          txRateKbps: 10,
          rxRateKbps: 60,
          shared: false,
        }),
      ).command,
    ).toBe("ip bandwidth del 192.168.1.50-192.168.1.100 10 60 0");

    expect(() =>
      ipBandwidth.buildFrames({ action: "default", txRateKbps: 40_000, rxRateKbps: 800 }),
    ).toThrow(/txRateKbps/);
    expect(() => ipBandwidth.buildFrames({ action: "schedule", profiles: [1, 2, 3, 17] })).toThrow(
      /profile/,
    );
    expect(() =>
      ipBandwidth.buildFrames({
        action: "delRange",
        ipStart: "not-an-ip",
        ipEnd: "192.168.1.100",
        txRateKbps: 10,
        rxRateKbps: 60,
        shared: false,
      }),
    ).toThrow(/ipStart/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBandwidth("Current ip Bandwidth limit is turn off\n")).toEqual({
      raw: "Current ip Bandwidth limit is turn off",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipBandwidth, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipBandwidth.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "ok\n");

    expect(stdout).toBe("ok\n");

    expect(ipBandwidth.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
