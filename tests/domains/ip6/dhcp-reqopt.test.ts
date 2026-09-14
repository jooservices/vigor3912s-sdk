import { describe, expect, it } from "vitest";

import { ip6DhcpReqOpt } from "../../../src/domains/ip6.js";
import { parseDhcpReqopt } from "../../../src/internal/parsers/ip6/dhcp-reqopt.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.dhcp.reqopt", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(ip6DhcpReqOpt.buildFrames({ action: "show", interfaceLabel: "WAN2" })).command,
    ).toBe("ip6 dhcp req_opt WAN2 -a");
    expect(
      firstFrame(
        ip6DhcpReqOpt.buildFrames({
          action: "set",
          interfaceLabel: "WAN2",
          flag: "S",
          enabled: true,
        }),
      ).command,
    ).toBe("ip6 dhcp req_opt WAN2 -S 1");
    expect(
      firstFrame(
        ip6DhcpReqOpt.buildFrames({
          action: "set",
          interfaceLabel: "WAN2",
          flag: "S",
          enabled: false,
        }),
      ).command,
    ).toBe("ip6 dhcp req_opt WAN2 -S 0");
    expect(() => ip6DhcpReqOpt.buildFrames({ action: "show", interfaceLabel: "BAD" })).toThrow(
      /interfaceLabel/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseDhcpReqopt(
        "% Interface WAN2 is set to request following DHCPv6 options:\
%     sip name\
",
      ),
    ).toEqual({
      raw: "% Interface WAN2 is set to request following DHCPv6 options:\
%     sip name",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6DhcpReqOpt, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ip6DhcpReqOpt.buildFrames({ action: "show", interfaceLabel: "WAN2" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% Interface WAN2 is set to request following DHCPv6 options:\
%     sip name\
",
    );

    expect(ip6DhcpReqOpt.parse([exchange(stdout)])).toEqual({
      raw: "% Interface WAN2 is set to request following DHCPv6 options:\
%     sip name",
    });
    expect(command).toBe("ip6 dhcp req_opt WAN2 -a");

    await expectClosedTransportFailure(command);
  });
});
