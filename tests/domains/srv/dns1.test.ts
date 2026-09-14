import { describe, expect, it } from "vitest";

import { srvDhcpDns1 } from "../../../src/domains/srv.js";
import { parseDns1 } from "../../../src/internal/parsers/srv/dns1.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.dhcp.dns1 -- srv dhcp dns1 <lan> <DNS IP address>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(srvDhcpDns1.buildFrames({ lan: 8, dnsIp: "168.95.1.1" }));

    expect(frame.command).toBe("srv dhcp dns1 lan8 168.95.1.1");

    expect(() => srvDhcpDns1.buildFrames({ lan: 0, dnsIp: "168.95.1.1" })).toThrow(/lan/);
    expect(() => srvDhcpDns1.buildFrames({ lan: 101, dnsIp: "168.95.1.1" })).toThrow(/lan/);
    expect(() => srvDhcpDns1.buildFrames({ lan: 8, dnsIp: "not-an-ip" })).toThrow(/dnsIp/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseDns1("% Now: 168.95.1.1\n")).toEqual({ raw: "% Now: 168.95.1.1" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvDhcpDns1, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvDhcpDns1.buildFrames({ lan: 8, dnsIp: "168.95.1.1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Now: 168.95.1.1\n");

    expect(stdout).toBe("% Now: 168.95.1.1\n");
    expect(srvDhcpDns1.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
