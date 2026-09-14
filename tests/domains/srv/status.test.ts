import { describe, expect, it } from "vitest";

import { srvDhcpStatus } from "../../../src/domains/srv.js";
import { parseDhcpStatus } from "../../../src/internal/parsers/srv/status.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_STATUS_TEXT = [
  "LAN1       : DHCP Server On    IP Pool: 192.168.1.10 ~ 192.168.1.209",
  "             Default Gateway: 192.168.1.1",
  "------------------------------------------------------------------------",
  "Index   IP Address      MAC Address             Leased Time     HOST ID",
  "------------------------------------------------------------------------",
  "LAN1",
  "1       192.168.1.10    08-BF-B8-D5-DD-A9       69:01:37        A1000460>",
].join("\n");

describe("cli.srv.dhcp.status -- srv dhcp status (read)", () => {
  it("builds the documented frames with and without an interface argument, and rejects invalid input", () => {
    const noArgFrame = firstFrame(srvDhcpStatus.buildFrames({}));

    expect(noArgFrame.command).toBe("srv dhcp status");

    const withArgFrame = firstFrame(srvDhcpStatus.buildFrames({ interfaceLabel: "lan1" }));

    expect(withArgFrame.command).toBe("srv dhcp status lan1");

    expect(() => srvDhcpStatus.buildFrames({ interfaceLabel: "lan101" })).toThrow(/interfaceLabel/);
  });

  it("parses the documented DHCP status sample into a structured report", () => {
    const report = parseDhcpStatus(SAMPLE_STATUS_TEXT);

    expect(report).toEqual({
      interfaceLabel: "LAN1",
      serverOn: true,
      poolStart: "192.168.1.10",
      poolEnd: "192.168.1.209",
      defaultGateway: "192.168.1.1",
      leases: [
        {
          index: 1,
          ipAddress: "192.168.1.10",
          macAddress: "08-BF-B8-D5-DD-A9",
          leasedTime: "69:01:37",
          hostId: "A1000460",
        },
      ],
    });
  });

  it("returns nulls and no leases for text that doesn't match the documented shape", () => {
    expect(parseDhcpStatus("not a status block")).toEqual({
      interfaceLabel: null,
      serverOn: null,
      poolStart: null,
      poolEnd: null,
      defaultGateway: null,
      leases: [],
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(srvDhcpStatus, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpStatus.buildFrames({})).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_STATUS_TEXT);

    expect(stdout).toBe(SAMPLE_STATUS_TEXT);
    expect(srvDhcpStatus.parse([{ stdout, stderr: "" }])).toEqual({
      interfaceLabel: "LAN1",
      serverOn: true,
      poolStart: "192.168.1.10",
      poolEnd: "192.168.1.209",
      defaultGateway: "192.168.1.1",
      leases: [
        {
          index: 1,
          ipAddress: "192.168.1.10",
          macAddress: "08-BF-B8-D5-DD-A9",
          leasedTime: "69:01:37",
          hostId: "A1000460",
        },
      ],
    });
    await expectClosedTransportFailure(command);
  });
});
