import { describe, expect, it } from "vitest";

import { ip6DhcpOptionS } from "../../../src/domains/ip6.js";
import { parseDhcpOptions } from "../../../src/internal/parsers/ip6/dhcp-options.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.dhcp.options", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6DhcpOptionS.buildFrames({ action: "list" })).command).toBe(
      "ip6 dhcp option_s -l",
    );
    expect(
      firstFrame(
        ip6DhcpOptionS.buildFrames({
          action: "setHex",
          enabled: true,
          lan: "1/2",
          optionNumber: 18,
          value: "2f70617468",
        }),
      ).command,
    ).toBe("ip6 dhcp option_s -e 1 -i 1/2 -c 18 -x 2f70617468");
    expect(
      firstFrame(
        ip6DhcpOptionS.buildFrames({
          action: "setHex",
          enabled: false,
          lan: "1",
          optionNumber: 18,
          value: "2f70617468",
        }),
      ).command,
    ).toBe("ip6 dhcp option_s -e 0 -i 1 -c 18 -x 2f70617468");
    expect(
      firstFrame(
        ip6DhcpOptionS.buildFrames({
          action: "setAscii",
          enabled: true,
          lan: "1",
          optionNumber: 30,
          value: "domain_name",
        }),
      ).command,
    ).toBe("ip6 dhcp option_s -e 1 -i 1 -c 30 -v domain_name");
    expect(
      firstFrame(
        ip6DhcpOptionS.buildFrames({
          action: "setAscii",
          enabled: false,
          lan: "1",
          optionNumber: 30,
          value: "domain_name",
        }),
      ).command,
    ).toBe("ip6 dhcp option_s -e 0 -i 1 -c 30 -v domain_name");
    expect(
      firstFrame(
        ip6DhcpOptionS.buildFrames({
          action: "setIp",
          enabled: true,
          lan: "1",
          optionNumber: 23,
          value: "2001:db8::1",
        }),
      ).command,
    ).toBe("ip6 dhcp option_s -e 1 -i 1 -c 23 -a 2001:db8::1");
    expect(
      firstFrame(
        ip6DhcpOptionS.buildFrames({
          action: "setIp",
          enabled: false,
          lan: "1",
          optionNumber: 23,
          value: "2001:db8::1",
        }),
      ).command,
    ).toBe("ip6 dhcp option_s -e 0 -i 1 -c 23 -a 2001:db8::1");
    expect(firstFrame(ip6DhcpOptionS.buildFrames({ action: "delete", index: 5 })).command).toBe(
      "ip6 dhcp option_s -d 5",
    );
    expect(firstFrame(ip6DhcpOptionS.buildFrames({ action: "update", index: 5 })).command).toBe(
      "ip6 dhcp option_s -u 5",
    );
    expect(firstFrame(ip6DhcpOptionS.buildFrames({ action: "removeAll" })).command).toBe(
      "ip6 dhcp option_s -r",
    );
    expect(() =>
      ip6DhcpOptionS.buildFrames({
        action: "setHex",
        enabled: true,
        lan: "not-a-lan",
        optionNumber: 18,
        value: "2f70617468",
      }),
    ).toThrow(/lan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseDhcpOptions(
        "% state   idx interface          opt    type     data\
% enable  1   LAN1/2             18     Hex      2f70617468\
",
      ),
    ).toEqual({
      raw: "% state   idx interface          opt    type     data\
% enable  1   LAN1/2             18     Hex      2f70617468",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6DhcpOptionS, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6DhcpOptionS.buildFrames({ action: "list" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% state   idx interface          opt    type     data\
% enable  1   LAN1/2             18     Hex      2f70617468\
",
    );

    expect(ip6DhcpOptionS.parse([exchange(stdout)])).toEqual({
      raw: "% state   idx interface          opt    type     data\
% enable  1   LAN1/2             18     Hex      2f70617468",
    });
    expect(command).toBe("ip6 dhcp option_s -l");

    await expectClosedTransportFailure(command);
  });
});
