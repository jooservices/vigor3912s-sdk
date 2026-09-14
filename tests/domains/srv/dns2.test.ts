import { describe, expect, it } from "vitest";

import { srvDhcpDns2 } from "../../../src/domains/srv.js";
import { parseDns2 } from "../../../src/internal/parsers/srv/dns2.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.dns2 -- srv dhcp dns2 <lan> <DNS IP address>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(srvDhcpDns2.buildFrames({ lan: 12, dnsIp: "10.1.1.1" }));

    expect(frame.command).toBe("srv dhcp dns2 lan12 10.1.1.1");

    expect(() => srvDhcpDns2.buildFrames({ lan: 0, dnsIp: "10.1.1.1" })).toThrow(/lan/);
    expect(() => srvDhcpDns2.buildFrames({ lan: 101, dnsIp: "10.1.1.1" })).toThrow(/lan/);
    expect(() => srvDhcpDns2.buildFrames({ lan: 12, dnsIp: "not-an-ip" })).toThrow(/dnsIp/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDns2("% Now: 10.1.1.1\n")).toEqual({ raw: "% Now: 10.1.1.1" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpDns2, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpDns2.buildFrames({ lan: 12, dnsIp: "10.1.1.1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 10.1.1.1\n");

    expect(stdout).toBe("% Now: 10.1.1.1\n");
    expect(srvDhcpDns2.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
