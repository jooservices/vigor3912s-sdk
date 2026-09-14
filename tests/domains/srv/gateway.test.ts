import { describe, expect, it } from "vitest";

import { srvDhcpGateway } from "../../../src/domains/srv.js";
import { parseGateway } from "../../../src/internal/parsers/srv/gateway.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.gateway -- srv dhcp gateway <Gateway IP>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(srvDhcpGateway.buildFrames({ gatewayIp: "192.168.2.1" }));

    expect(frame.command).toBe("srv dhcp gateway 192.168.2.1");

    expect(() => srvDhcpGateway.buildFrames({ gatewayIp: "not-an-ip" })).toThrow(/gatewayIp/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseGateway(
        ' This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.\n',
      ),
    ).toEqual({
      raw: 'This setting will take effect after rebooting.\n Please use "sys reboot" command to reboot the router.',
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpGateway, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpGateway.buildFrames({ gatewayIp: "192.168.2.1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 192.168.2.1\n");

    expect(stdout).toBe("% Now: 192.168.2.1\n");
    expect(srvDhcpGateway.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
