import { describe, expect, it } from "vitest";

import { srvDhcpDhcp2 } from "../../../src/domains/srv.js";
import { parseDhcp2 } from "../../../src/internal/parsers/srv/dhcp2.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.dhcp2 -- srv dhcp dhcp2", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(srvDhcpDhcp2.buildFrames({ action: "view" })).command).toBe(
      "srv dhcp dhcp2 -v",
    );
    expect(
      firstFrame(srvDhcpDhcp2.buildFrames({ action: "lanAssign", enabled: true })).command,
    ).toBe("srv dhcp dhcp2 -l 1");
    expect(
      firstFrame(srvDhcpDhcp2.buildFrames({ action: "lanAssign", enabled: false })).command,
    ).toBe("srv dhcp dhcp2 -l 0");
    expect(
      firstFrame(srvDhcpDhcp2.buildFrames({ action: "macAssign", enabled: true })).command,
    ).toBe("srv dhcp dhcp2 -m 1");
    expect(
      firstFrame(srvDhcpDhcp2.buildFrames({ action: "macAssign", enabled: false })).command,
    ).toBe("srv dhcp dhcp2 -m 0");
    expect(firstFrame(srvDhcpDhcp2.buildFrames({ action: "enablePort", portId: 3 })).command).toBe(
      "srv dhcp dhcp2 -e 3",
    );
    expect(firstFrame(srvDhcpDhcp2.buildFrames({ action: "disablePort", portId: 4 })).command).toBe(
      "srv dhcp dhcp2 -d 4",
    );
    expect(() => srvDhcpDhcp2.buildFrames({ action: "enablePort", portId: 2 as 3 })).toThrow(
      /portId/,
    );
    expect(() => srvDhcpDhcp2.buildFrames({ action: "disablePort", portId: 2 as 3 })).toThrow(
      /portId/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseDhcp2(
        " 2nd DHCP server flag status --\
   Port 3 flag: ON\
",
      ),
    ).toEqual({
      raw: "2nd DHCP server flag status --\
   Port 3 flag: ON",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpDhcp2, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpDhcp2.buildFrames({ action: "view" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " 2nd DHCP server flag status --\
   Port 3 flag: ON\
",
    );

    expect(stdout).toBe(
      " 2nd DHCP server flag status --\
   Port 3 flag: ON\
",
    );
    expect(srvDhcpDhcp2.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
