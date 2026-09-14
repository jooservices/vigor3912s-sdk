import { describe, expect, it } from "vitest";

import { ip6Addr } from "../../../src/domains/ip6.js";
import { parseAddr } from "../../../src/internal/parsers/ip6/addr.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

const SAMPLE_SHOW_TEXT = [
  "LAN1",
  "Unicast Address:",
  " FE80::21D:AAFF:FE4B:3E80/64 (Link)",
  "Multicast Address:",
  " FF02::1",
  "",
].join("\n");

describe("cli.ip6.addr -- ip6 addr (write)", () => {
  it("builds documented frames per variant and rejects malformed input", () => {
    expect(
      firstFrame(
        ip6Addr.buildFrames({
          action: "set",
          prefix: "2001:db8::",
          prefixLength: 64,
          interfaceLabel: "LAN1",
        }),
      ).command,
    ).toBe("ip6 addr -s 2001:db8:: 64 LAN1");

    expect(
      firstFrame(
        ip6Addr.buildFrames({
          action: "delete",
          prefix: "2001:db8::",
          prefixLength: 64,
          interfaceLabel: "VPN10",
        }),
      ).command,
    ).toBe("ip6 addr -d 2001:db8:: 64 VPN10");

    expect(firstFrame(ip6Addr.buildFrames({ action: "show" })).command).toBe("ip6 addr -a");
    expect(
      firstFrame(ip6Addr.buildFrames({ action: "show", interfaceLabel: "WAN2", unicastOnly: true }))
        .command,
    ).toBe("ip6 addr -a WAN2 -u");
    expect(
      firstFrame(ip6Addr.buildFrames({ action: "showPrefix", interfaceLabel: "LAN1" })).command,
    ).toBe("ip6 addr -v LAN1");
    expect(firstFrame(ip6Addr.buildFrames({ action: "showPrefix" })).command).toBe("ip6 addr -v");

    expect(() =>
      ip6Addr.buildFrames({
        action: "set",
        prefix: "192.168.1.1",
        prefixLength: 64,
        interfaceLabel: "LAN1",
      }),
    ).toThrow(/prefix/);
    expect(() =>
      ip6Addr.buildFrames({
        action: "set",
        prefix: "2001:db8::",
        prefixLength: 64,
        interfaceLabel: "not-an-interface",
      }),
    ).toThrow(/interfaceLabel/);
    expect(() =>
      ip6Addr.buildFrames({
        action: "set",
        prefix: "2001:db8::",
        prefixLength: 200,
        interfaceLabel: "LAN1",
      }),
    ).toThrow(/prefixLength/);
    expect(() =>
      ip6Addr.buildFrames({
        action: "set",
        prefix: "2001:db8::",
        prefixLength: 64,
        interfaceLabel: "VPN501",
      }),
    ).toThrow(/interfaceLabel/);
    expect(() => ip6Addr.buildFrames({ action: "showPrefix", interfaceLabel: "VPN1" })).toThrow(
      /interfaceLabel/,
    );
  });

  it("parses the documented address-status text (synthetic sample)", () => {
    expect(parseAddr(SAMPLE_SHOW_TEXT)).toEqual({ raw: SAMPLE_SHOW_TEXT.trim() });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Addr, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Addr.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, SAMPLE_SHOW_TEXT);

    expect(ip6Addr.parse([exchange(stdout)])).toEqual({ raw: SAMPLE_SHOW_TEXT.trim() });

    await expectClosedTransportFailure(command);
  });
});
