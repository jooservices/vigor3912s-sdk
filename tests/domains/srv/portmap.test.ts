import { describe, expect, it } from "vitest";

import { srvNatPortmap } from "../../../src/domains/srv.js";
import { parsePortmap } from "../../../src/internal/parsers/srv/portmap.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.srv.nat.portmap -- srv nat portmap add|del|disable|enable|flush|table|view", () => {
  it("builds the documented frames for each sub-form and rejects invalid input", () => {
    const addFrame = firstFrame(
      srvNatPortmap.buildFrames({
        action: "add",
        index: 1,
        serviceName: "name",
        protocol: "TCP",
        publicPort: 100,
        sourceIpType: 0,
        sourceIpIndex: 0,
        privateIp: "192.168.1.10",
        privatePort: 200,
        wanIndex: "wan1",
        aliasIpIndex: 1,
      }),
    );

    expect(addFrame.command).toBe("srv nat portmap add 1 name tcp 100 0 0 192.168.1.10 200 wan1 1");

    expect(firstFrame(srvNatPortmap.buildFrames({ action: "delete", index: 1 })).command).toBe(
      "srv nat portmap del 1",
    );
    expect(firstFrame(srvNatPortmap.buildFrames({ action: "disable", index: 1 })).command).toBe(
      "srv nat portmap disable 1",
    );
    expect(
      firstFrame(srvNatPortmap.buildFrames({ action: "enable", index: 1, protocol: "UDP" }))
        .command,
    ).toBe("srv nat portmap enable 1 udp");
    expect(firstFrame(srvNatPortmap.buildFrames({ action: "flush" })).command).toBe(
      "srv nat portmap flush",
    );
    expect(firstFrame(srvNatPortmap.buildFrames({ action: "table" })).command).toBe(
      "srv nat portmap table",
    );
    expect(firstFrame(srvNatPortmap.buildFrames({ action: "view" })).command).toBe(
      "srv nat portmap view",
    );

    expect(() =>
      srvNatPortmap.buildFrames({
        action: "add",
        index: 261,
        serviceName: "name",
        protocol: "TCP",
        publicPort: 100,
        sourceIpType: 0,
        sourceIpIndex: 0,
        privateIp: "192.168.1.10",
        privatePort: 200,
        wanIndex: "wan1",
        aliasIpIndex: 1,
      }),
    ).toThrow(/index/);
    expect(() =>
      srvNatPortmap.buildFrames({
        action: "add",
        index: 1,
        serviceName: "name",
        protocol: "TCP",
        publicPort: 100,
        sourceIpType: 0,
        sourceIpIndex: 0,
        privateIp: "192.168.1.10",
        privatePort: 200,
        wanIndex: "wan13",
        aliasIpIndex: 1,
      }),
    ).toThrow(/wanIndex/);
  });

  it("parses the documented port redirection table text (synthetic sample)", () => {
    expect(parsePortmap("NAT Port Redirection Configuration Table:\n")).toEqual({
      raw: "NAT Port Redirection Configuration Table:",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(srvNatPortmap, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(srvNatPortmap.buildFrames({ action: "table" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "NAT Port Redirection Configuration Table:\n",
    );

    expect(stdout).toBe("NAT Port Redirection Configuration Table:\n");
    expect(srvNatPortmap.parse([{ stdout, stderr: "" }])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
