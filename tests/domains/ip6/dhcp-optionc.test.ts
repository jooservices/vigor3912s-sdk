import { describe, expect, it } from "vitest";

import { ip6DhcpOptionC } from "../../../src/domains/ip6.js";
import { parseDhcpOptionc } from "../../../src/internal/parsers/ip6/dhcp-optionc.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.dhcp.optionc", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6DhcpOptionC.buildFrames({ action: "list" })).command).toBe(
      "ip6 dhcp option_c -l",
    );
    expect(
      firstFrame(
        ip6DhcpOptionC.buildFrames({
          action: "setAscii",
          enabled: true,
          wan: "1/2",
          optionNumber: 30,
          value: "domain_name",
        }),
      ).command,
    ).toBe("ip6 dhcp option_c -e 1 -w 1/2 -c 30 -v domain_name");
    expect(
      firstFrame(
        ip6DhcpOptionC.buildFrames({
          action: "setAscii",
          enabled: false,
          wan: "1",
          optionNumber: 30,
          value: "domain_name",
        }),
      ).command,
    ).toBe("ip6 dhcp option_c -e 0 -w 1 -c 30 -v domain_name");
    expect(
      firstFrame(
        ip6DhcpOptionC.buildFrames({
          action: "setHex",
          enabled: true,
          wan: "1",
          optionNumber: 18,
          value: "2f70617468",
        }),
      ).command,
    ).toBe("ip6 dhcp option_c -e 1 -w 1 -c 18 -x 2f70617468");
    expect(
      firstFrame(
        ip6DhcpOptionC.buildFrames({
          action: "setHex",
          enabled: false,
          wan: "1",
          optionNumber: 18,
          value: "2f70617468",
        }),
      ).command,
    ).toBe("ip6 dhcp option_c -e 0 -w 1 -c 18 -x 2f70617468");
    expect(
      firstFrame(
        ip6DhcpOptionC.buildFrames({
          action: "setIp",
          enabled: true,
          wan: "1",
          optionNumber: 23,
          value: "2001:db8::1",
        }),
      ).command,
    ).toBe("ip6 dhcp option_c -e 1 -w 1 -c 23 -a 2001:db8::1");
    expect(
      firstFrame(
        ip6DhcpOptionC.buildFrames({
          action: "setIp",
          enabled: false,
          wan: "1",
          optionNumber: 23,
          value: "2001:db8::1",
        }),
      ).command,
    ).toBe("ip6 dhcp option_c -e 0 -w 1 -c 23 -a 2001:db8::1");
    expect(firstFrame(ip6DhcpOptionC.buildFrames({ action: "delete", index: 5 })).command).toBe(
      "ip6 dhcp option_c -d 5",
    );
    expect(firstFrame(ip6DhcpOptionC.buildFrames({ action: "update", index: 5 })).command).toBe(
      "ip6 dhcp option_c -u 5",
    );
    expect(firstFrame(ip6DhcpOptionC.buildFrames({ action: "removeAll" })).command).toBe(
      "ip6 dhcp option_c -r",
    );
    expect(() =>
      ip6DhcpOptionC.buildFrames({
        action: "setAscii",
        enabled: true,
        wan: "11",
        optionNumber: 30,
        value: "domain_name",
      }),
    ).toThrow(/wan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseDhcpOptionc(
        "% state   idx interface          opt    type     data\
% enable  1   WAN1|2             30     ASCII    domain_name\
",
      ),
    ).toEqual({
      raw: "% state   idx interface          opt    type     data\
% enable  1   WAN1|2             30     ASCII    domain_name",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6DhcpOptionC, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6DhcpOptionC.buildFrames({ action: "list" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% state   idx interface          opt    type     data\
% enable  1   WAN1|2             30     ASCII    domain_name\
",
    );

    expect(ip6DhcpOptionC.parse([exchange(stdout)])).toEqual({
      raw: "% state   idx interface          opt    type     data\
% enable  1   WAN1|2             30     ASCII    domain_name",
    });
    expect(command).toBe("ip6 dhcp option_c -l");

    await expectClosedTransportFailure(command);
  });
});
