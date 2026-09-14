import { describe, expect, it } from "vitest";

import { srvDhcpRelay } from "../../../src/domains/srv.js";
import { parseRelay } from "../../../src/internal/parsers/srv/relay.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.relay -- srv dhcp relay servip|2nd_servip|subnet", () => {
  it("builds the documented frames for each action and rejects invalid input", () => {
    const servipFrame = firstFrame(
      srvDhcpRelay.buildFrames({ action: "servip", serverIp: "192.168.1.46" }),
    );

    expect(servipFrame.command).toBe("srv dhcp relay servip 192.168.1.46");

    const secondaryFrame = firstFrame(
      srvDhcpRelay.buildFrames({ action: "secondaryServip", serverIp: "192.168.1.47" }),
    );

    expect(secondaryFrame.command).toBe("srv dhcp relay 2nd_servip 192.168.1.47");

    const subnetFrame = firstFrame(srvDhcpRelay.buildFrames({ action: "subnet", index: 2 }));

    expect(subnetFrame.command).toBe("srv dhcp relay subnet 2");

    expect(() => srvDhcpRelay.buildFrames({ action: "servip", serverIp: "not-an-ip" })).toThrow(
      /serverIp/,
    );
    expect(() =>
      srvDhcpRelay.buildFrames({ action: "subnet", index: 3 as unknown as 1 | 2 }),
    ).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseRelay("% Now: 192.168.1.46\n")).toEqual({ raw: "% Now: 192.168.1.46" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpRelay, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(
      srvDhcpRelay.buildFrames({ action: "servip", serverIp: "192.168.1.46" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 192.168.1.46\n");

    expect(stdout).toBe("% Now: 192.168.1.46\n");
    expect(srvDhcpRelay.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
