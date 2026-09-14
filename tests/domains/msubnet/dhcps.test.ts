import { describe, expect, it } from "vitest";

import { msubnetDhcps } from "../../../src/domains/msubnet.js";
import { parseDhcps } from "../../../src/internal/parsers/msubnet/dhcps.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.msubnet.dhcps -- msubnet dhcps", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(msubnetDhcps.buildFrames({ lanIndex: 3, enabled: false }));

    expect(frame.command).toBe("msubnet dhcps 3 Off");

    expect(() => msubnetDhcps.buildFrames({ lanIndex: 1, enabled: false })).toThrow(/lanIndex/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDhcps("% LAN3        Subnet DHCP Server disabled!\n")).toEqual({
      raw: "% LAN3        Subnet DHCP Server disabled!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(msubnetDhcps, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(msubnetDhcps.buildFrames({ lanIndex: 3, enabled: false })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% LAN3        Subnet DHCP Server disabled!\n",
    );

    expect(stdout).toBe("% LAN3        Subnet DHCP Server disabled!\n");
    await expectClosedTransportFailure(command);
  });

  it("wires .parse through firstExchangeText to the underlying parser", () => {
    const sampleText = "% LAN3        Subnet DHCP Server disabled!\n";

    expect(msubnetDhcps.parse([{ stdout: sampleText, stderr: "" }])).toEqual(
      parseDhcps(sampleText),
    );
  });
});
