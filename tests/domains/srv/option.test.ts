import { describe, expect, it } from "vitest";

import { srvDhcpOption } from "../../../src/domains/srv.js";
import { parseOption } from "../../../src/internal/parsers/srv/option.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.option", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpOption.buildFrames({ action: "list" })).command).toBe(
      "srv dhcp option -l",
    );
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setAscii",
          enabled: true,
          lan: "a",
          optionNumber: 18,
          value: "path",
        }),
      ).command,
    ).toBe("srv dhcp option -e 1 -i a -c 18 -v path");
    expect(() =>
      srvDhcpOption.buildFrames({
        action: "setAscii",
        enabled: true,
        lan: "xyz",
        optionNumber: 18,
        value: "path",
      }),
    ).toThrow(/lan/);
    expect(firstFrame(srvDhcpOption.buildFrames({ action: "delete", index: 1 })).command).toBe(
      "srv dhcp option -d 1",
    );
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setHex",
          enabled: true,
          lan: "a",
          optionNumber: 18,
          value: "70617468",
        }),
      ).command,
    ).toBe("srv dhcp option -e 1 -i a -c 18 -x 70617468");
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setHex",
          enabled: false,
          lan: "a",
          optionNumber: 18,
          value: "70617468",
        }),
      ).command,
    ).toBe("srv dhcp option -e 0 -i a -c 18 -x 70617468");
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setIp",
          enabled: true,
          lan: "a",
          optionNumber: 18,
          value: "192.168.1.1",
        }),
      ).command,
    ).toBe("srv dhcp option -e 1 -i a -c 18 -a 192.168.1.1");
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setIp",
          enabled: false,
          lan: "a",
          optionNumber: 18,
          value: "192.168.1.1",
        }),
      ).command,
    ).toBe("srv dhcp option -e 0 -i a -c 18 -a 192.168.1.1");
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setNextServer",
          enabled: true,
          lan: "a",
          nextServerIp: "192.168.1.2",
        }),
      ).command,
    ).toBe("srv dhcp option -e 1 -i a -s 192.168.1.2");
    expect(
      firstFrame(
        srvDhcpOption.buildFrames({
          action: "setNextServer",
          enabled: false,
          lan: "a",
          nextServerIp: "192.168.1.2",
        }),
      ).command,
    ).toBe("srv dhcp option -e 0 -i a -s 192.168.1.2");
    expect(firstFrame(srvDhcpOption.buildFrames({ action: "update", index: 1 })).command).toBe(
      "srv dhcp option -u 1",
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseOption(
        "% state   idx interface          opt type     data\
% enable  1   ALL LAN            18  ASCII    path\
",
      ),
    ).toEqual({
      raw: "% state   idx interface          opt type     data\
% enable  1   ALL LAN            18  ASCII    path",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpOption, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpOption.buildFrames({ action: "list" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% state   idx interface          opt type     data\
% enable  1   ALL LAN            18  ASCII    path\
",
    );

    expect(stdout).toBe(
      "% state   idx interface          opt type     data\
% enable  1   ALL LAN            18  ASCII    path\
",
    );
    expect(srvDhcpOption.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
