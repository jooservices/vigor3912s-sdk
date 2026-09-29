import { describe, expect, it } from "vitest";

import { ddnsSet } from "../../src/domains/ddns.js";
import { dosConfigure, dosView } from "../../src/domains/dos.js";
import { ipAddr, ipArp, ipDhcpc } from "../../src/domains/ip.js";

describe("input schemas round-trip against buildFrames", () => {
  it("cli.ip.addr — a schema-shaped sample input is accepted by buildFrames", () => {
    expect(() => ipAddr.buildFrames({ ipv4Address: "192.168.1.1" })).not.toThrow();
  });

  it("cli.ip.arp — every oneOf branch's sample input is accepted by buildFrames", () => {
    expect(() => ipArp.buildFrames({ action: "status" })).not.toThrow();
    expect(() => ipArp.buildFrames({ action: "acceptStatus" })).not.toThrow();
  });

  it("cli.ip.dhcpc — every oneOf branch's sample input is accepted by buildFrames", () => {
    expect(() => ipDhcpc.buildFrames({ action: "status" })).not.toThrow();
    expect(() => ipDhcpc.buildFrames({ action: "release", wanNumber: 1 })).not.toThrow();
    expect(() => ipDhcpc.buildFrames({ action: "renew", wanNumber: 1 })).not.toThrow();
    expect(() =>
      ipDhcpc.buildFrames({
        action: "setOption",
        enabled: true,
        wanNumber: 1,
        optionNumber: 1,
        value: "x",
      }),
    ).not.toThrow();
  });

  it("cli.ddns.set — a schema-shaped sample input is accepted by buildFrames", () => {
    expect(() =>
      ddnsSet.buildFrames({
        accountIndex: 1,
        serviceProvider: 1,
        serviceType: 1,
        domainName: "example.dyndns.org",
        loginName: "user",
        password: "secret",
      }),
    ).not.toThrow();
  });

  it("cli.dos — a schema-shaped sample input (array field) is accepted by buildFrames", () => {
    expect(() => dosConfigure.buildFrames({ args: ["-s"] })).not.toThrow();
  });

  it("cli.dos.v — a void operation's buildFrames takes no argument", () => {
    expect(() => dosView.buildFrames()).not.toThrow();
  });
});
