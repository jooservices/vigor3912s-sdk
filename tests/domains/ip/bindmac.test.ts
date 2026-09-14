import { describe, expect, it } from "vitest";

import { ipBindmac } from "../../../src/domains/ip.js";
import { parseBindmac } from "../../../src/internal/parsers/ip/bindmac.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.bindmac -- ip bindmac", () => {
  it("builds the documented frames per variant and rejects invalid input", () => {
    expect(firstFrame(ipBindmac.buildFrames({ action: "mode", mode: "on" })).command).toBe(
      "ip bindmac on",
    );
    expect(
      firstFrame(
        ipBindmac.buildFrames({
          action: "add",
          ipv4Address: "192.168.1.10",
          mac: "AA:BB:CC:DD:EE:FF",
          comment: "test-host",
        }),
      ).command,
    ).toBe("ip bindmac add 192.168.1.10 AA:BB:CC:DD:EE:FF test-host");
    expect(firstFrame(ipBindmac.buildFrames({ action: "del", target: "all" })).command).toBe(
      "ip bindmac del all",
    );
    expect(
      firstFrame(ipBindmac.buildFrames({ action: "del", target: "192.168.1.10" })).command,
    ).toBe("ip bindmac del 192.168.1.10");
    expect(firstFrame(ipBindmac.buildFrames({ action: "subnetAll" })).command).toBe(
      "ip bindmac subnet all",
    );
    expect(firstFrame(ipBindmac.buildFrames({ action: "subnetSet", lanIndex: 2 })).command).toBe(
      "ip bindmac subnet set LAN2",
    );
    expect(firstFrame(ipBindmac.buildFrames({ action: "subnetUnset", lanIndex: 3 })).command).toBe(
      "ip bindmac subnet unset LAN3",
    );
    expect(firstFrame(ipBindmac.buildFrames({ action: "subnetClear" })).command).toBe(
      "ip bindmac subnet clear",
    );
    expect(firstFrame(ipBindmac.buildFrames({ action: "subnetShow" })).command).toBe(
      "ip bindmac subnet show",
    );
    expect(firstFrame(ipBindmac.buildFrames({ action: "show" })).command).toBe("ip bindmac show");

    expect(() =>
      ipBindmac.buildFrames({
        action: "add",
        ipv4Address: "not-an-ip",
        mac: "AA:BB:CC:DD:EE:FF",
        comment: "x",
      }),
    ).toThrow(/ipv4Address/);
    expect(() =>
      ipBindmac.buildFrames({
        action: "add",
        ipv4Address: "192.168.1.10",
        mac: "not-a-mac",
        comment: "x",
      }),
    ).toThrow(/mac must be a colon-separated MAC address/);
    expect(() => ipBindmac.buildFrames({ action: "del", target: "not-an-ip" })).toThrow(/target/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBindmac("%% ip bindmac [on|off], IP-MAC binding is On\n")).toEqual({
      raw: "%% ip bindmac [on|off], IP-MAC binding is On",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ipBindmac, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipBindmac.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "ok\n");

    expect(stdout).toBe("ok\n");

    expect(ipBindmac.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
