import { describe, expect, it } from "vitest";

import { ip6DhcpServer } from "../../../src/domains/ip6.js";
import { parseDhcpServer } from "../../../src/internal/parsers/ip6/dhcp-server.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.dhcp.server", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6DhcpServer.buildFrames({ action: "show" })).command).toBe(
      "ip6 dhcp server -a",
    );
    expect(
      firstFrame(ip6DhcpServer.buildFrames({ action: "setDns1", address: "ff02::1" })).command,
    ).toBe("ip6 dhcp server -d ff02::1");
    expect(firstFrame(ip6DhcpServer.buildFrames({ action: "showAssignment" })).command).toBe(
      "ip6 dhcp server -b",
    );
    expect(firstFrame(ip6DhcpServer.buildFrames({ action: "enable", enabled: true })).command).toBe(
      "ip6 dhcp server -e 1",
    );
    expect(
      firstFrame(ip6DhcpServer.buildFrames({ action: "enable", enabled: false })).command,
    ).toBe("ip6 dhcp server -e 0");
    expect(
      firstFrame(ip6DhcpServer.buildFrames({ action: "setPoolMin", address: "ff02::1" })).command,
    ).toBe("ip6 dhcp server -i ff02::1");
    expect(
      firstFrame(ip6DhcpServer.buildFrames({ action: "setPoolMax", address: "ff02::2" })).command,
    ).toBe("ip6 dhcp server -x ff02::2");
    expect(
      firstFrame(ip6DhcpServer.buildFrames({ action: "setDns2", address: "ff02::3" })).command,
    ).toBe("ip6 dhcp server -D ff02::3");
    expect(() => ip6DhcpServer.buildFrames({ action: "setDns1", address: "1.2.3.4" })).toThrow(
      /address/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseDhcpServer(
        "% Interface LAN has following DHCPv6 server settings:\
%     DHCPv6 server disabled\
",
      ),
    ).toEqual({
      raw: "% Interface LAN has following DHCPv6 server settings:\
%     DHCPv6 server disabled",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6DhcpServer, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6DhcpServer.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Interface LAN has following DHCPv6 server settings:\
%     DHCPv6 server disabled\
",
    );

    expect(ip6DhcpServer.parse([exchange(stdout)])).toEqual({
      raw: "% Interface LAN has following DHCPv6 server settings:\
%     DHCPv6 server disabled",
    });
    expect(command).toBe("ip6 dhcp server -a");

    await expectClosedTransportFailure(command);
  });
});
