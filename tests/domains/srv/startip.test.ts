import { describe, expect, it } from "vitest";

import { srvDhcpStartip } from "../../../src/domains/srv.js";
import { parseStartip } from "../../../src/internal/parsers/srv/startip.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.startip -- srv dhcp startip <IP address>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(srvDhcpStartip.buildFrames({ startIp: "192.168.1.53" }));

    expect(frame.command).toBe("srv dhcp startip 192.168.1.53");

    expect(() => srvDhcpStartip.buildFrames({ startIp: "not-an-ip" })).toThrow(/startIp/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseStartip(
        ' This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.\n',
      ),
    ).toEqual({
      raw: 'This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.',
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpStartip, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpStartip.buildFrames({ startIp: "192.168.1.53" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 192.168.1.53\n");

    expect(stdout).toBe("% Now: 192.168.1.53\n");
    expect(srvDhcpStartip.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
