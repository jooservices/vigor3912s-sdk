import { describe, expect, it } from "vitest";

import { ip6DhcpClient } from "../../../src/domains/ip6.js";
import { parseDhcpClient } from "../../../src/internal/parsers/ip6/dhcp-client.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.dhcp.client", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6DhcpClient.buildFrames({ action: "show", wan: "WAN2" })).command).toBe(
      "ip6 dhcp client WAN2 -a",
    );
    expect(
      firstFrame(ip6DhcpClient.buildFrames({ action: "requestPd", wan: "WAN2", iaid: "2008::1" }))
        .command,
    ).toBe("ip6 dhcp client WAN2 -p 2008::1");
    expect(
      firstFrame(ip6DhcpClient.buildFrames({ action: "enable", wan: "WAN2", enabled: true }))
        .command,
    ).toBe("ip6 dhcp client WAN2 -e 1");
    expect(
      firstFrame(ip6DhcpClient.buildFrames({ action: "enable", wan: "WAN2", enabled: false }))
        .command,
    ).toBe("ip6 dhcp client WAN2 -e 0");
    expect(firstFrame(ip6DhcpClient.buildFrames({ action: "release", wan: "WAN2" })).command).toBe(
      "ip6 dhcp client WAN2 -r",
    );
    expect(
      firstFrame(ip6DhcpClient.buildFrames({ action: "displayDuid", wan: "WAN2" })).command,
    ).toBe("ip6 dhcp client WAN2 -d");
    expect(() => ip6DhcpClient.buildFrames({ action: "show", wan: "LAN1" })).toThrow(/wan/);
    expect(() =>
      ip6DhcpClient.buildFrames({ action: "requestPd", wan: "WAN2", iaid: "  " }),
    ).toThrow(/iaid/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseDhcpClient(
        "% Interface WAN2 has following DHCPv6 client settings:\
%     DHCPv6 client disabled\
",
      ),
    ).toEqual({
      raw: "% Interface WAN2 has following DHCPv6 client settings:\
%     DHCPv6 client disabled",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6DhcpClient, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6DhcpClient.buildFrames({ action: "show", wan: "WAN2" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Interface WAN2 has following DHCPv6 client settings:\
%     DHCPv6 client disabled\
",
    );

    expect(ip6DhcpClient.parse([exchange(stdout)])).toEqual({
      raw: "% Interface WAN2 has following DHCPv6 client settings:\
%     DHCPv6 client disabled",
    });
    expect(command).toBe("ip6 dhcp client WAN2 -a");

    await expectClosedTransportFailure(command);
  });
});
