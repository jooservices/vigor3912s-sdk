import { describe, expect, it } from "vitest";

import { ipBgp } from "../../../src/domains/ip.js";
import { parseBgp } from "../../../src/internal/parsers/ip/bgp.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.bgp -- ip bgp", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipBgp.buildFrames({ action: "mode", enabled: true })).command).toBe(
      "ip bgp mode 1",
    );
    expect(firstFrame(ipBgp.buildFrames({ action: "as", asNumber: 65000 })).command).toBe(
      "ip bgp as 65000",
    );
    expect(firstFrame(ipBgp.buildFrames({ action: "hold", seconds: 180 })).command).toBe(
      "ip bgp hold 180",
    );
    expect(firstFrame(ipBgp.buildFrames({ action: "retry", seconds: 120 })).command).toBe(
      "ip bgp retry 120",
    );
    expect(
      firstFrame(ipBgp.buildFrames({ action: "id", ipv4Address: "192.168.1.1" })).command,
    ).toBe("ip bgp id 192.168.1.1");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborMode", idx: 1, enabled: true })).command,
    ).toBe("ip bgp neighbor 1 mode 1");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborName", idx: 1, name: "peer1" })).command,
    ).toBe("ip bgp neighbor 1 name peer1");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborIp", idx: 1, ipv4Address: "10.0.0.2" }))
        .command,
    ).toBe("ip bgp neighbor 1 ip 10.0.0.2");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborAs", idx: 1, asNumber: 65001 })).command,
    ).toBe("ip bgp neighbor 1 as 65001");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborWeight", idx: 1, weight: 3 })).command,
    ).toBe("ip bgp neighbor 1 weight 3");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborPrepend", idx: 2, prepend: 1 })).command,
    ).toBe("ip bgp neighbor 2 prepend 1");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborMd5", idx: 1, enabled: false })).command,
    ).toBe("ip bgp neighbor 1 md5 0");
    expect(
      firstFrame(ipBgp.buildFrames({ action: "neighborKey", idx: 1, key: "secret" })).command,
    ).toBe("ip bgp neighbor 1 key secret");
    expect(
      firstFrame(
        ipBgp.buildFrames({
          action: "staticSet",
          sidx: 1,
          ipv4Address: "192.168.2.56",
          netmask: "255.255.255.0",
        }),
      ).command,
    ).toBe("ip bgp static 1 192.168.2.56 255.255.255.0");
    expect(firstFrame(ipBgp.buildFrames({ action: "staticDelete", sidx: 1 })).command).toBe(
      "ip bgp static 1 delete",
    );

    expect(() => ipBgp.buildFrames({ action: "hold", seconds: 5 })).toThrow(/seconds/);
    expect(() =>
      ipBgp.buildFrames({ action: "neighborName", idx: 1, name: "this-name-is-way-too-long" }),
    ).toThrow(/name/);
    expect(() => ipBgp.buildFrames({ action: "neighborName", idx: 1, name: "peer one" })).toThrow(
      /name must not contain whitespace/,
    );
    expect(() => ipBgp.buildFrames({ action: "neighborKey", idx: 1, key: "secret key" })).toThrow(
      /key must not contain whitespace/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBgp("Set static network index: 1\n")).toEqual({
      raw: "Set static network index: 1",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipBgp, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipBgp.buildFrames({ action: "mode", enabled: true })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "Set static network index: 1\n");

    expect(stdout).toBe("Set static network index: 1\n");

    expect(ipBgp.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
