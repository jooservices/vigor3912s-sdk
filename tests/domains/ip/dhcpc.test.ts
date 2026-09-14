import { describe, expect, it } from "vitest";

import { ipDhcpc } from "../../../src/domains/ip.js";
import { parseDhcpc } from "../../../src/internal/parsers/ip/dhcpc.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.dhcpc -- ip dhcpc", () => {
  it("builds the documented frames per variant and rejects invalid input", () => {
    expect(firstFrame(ipDhcpc.buildFrames({ action: "status" })).command).toBe("ip dhcpc status");
    expect(firstFrame(ipDhcpc.buildFrames({ action: "release", wanNumber: 1 })).command).toBe(
      "ip dhcpc release 1",
    );
    expect(firstFrame(ipDhcpc.buildFrames({ action: "renew", wanNumber: 2 })).command).toBe(
      "ip dhcpc renew 2",
    );
    expect(
      firstFrame(
        ipDhcpc.buildFrames({
          action: "setOption",
          enabled: true,
          wanNumber: 1,
          optionNumber: 18,
          value: "/path1",
        }),
      ).command,
    ).toBe("ip dhcpc option -e 1 -w 1 -c 18 -v /path1");
    expect(
      firstFrame(
        ipDhcpc.buildFrames({
          action: "setOption",
          enabled: false,
          wanNumber: 1,
          optionNumber: 18,
          value: "/path1",
        }),
      ).command,
    ).toBe("ip dhcpc option -e 0 -w 1 -c 18 -v /path1");

    expect(() => ipDhcpc.buildFrames({ action: "release", wanNumber: 0 })).toThrow(/wanNumber/);
    expect(() =>
      ipDhcpc.buildFrames({
        action: "setOption",
        enabled: true,
        wanNumber: 1,
        optionNumber: 300,
        value: "/path1",
      }),
    ).toThrow(/optionNumber/);
    expect(() =>
      ipDhcpc.buildFrames({
        action: "setOption",
        enabled: true,
        wanNumber: 1,
        optionNumber: 18,
        value: "",
      }),
    ).toThrow(/value/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDhcpc("DHCP Client Status: None active DHCP client!\n")).toEqual({
      raw: "DHCP Client Status: None active DHCP client!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipDhcpc, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipDhcpc.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "DHCP Client Status: None active DHCP client!\n",
    );

    expect(stdout).toBe("DHCP Client Status: None active DHCP client!\n");

    expect(ipDhcpc.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
