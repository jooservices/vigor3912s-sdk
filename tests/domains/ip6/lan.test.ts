import { describe, expect, it } from "vitest";

import { ip6Lan } from "../../../src/domains/ip6.js";
import { parseLan } from "../../../src/internal/parsers/ip6/lan.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.lan", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(
        ip6Lan.buildFrames({
          action: "set",
          lan: 2,
          primaryWan: 1,
          dns1: "2001:4860:4860::8888",
          otherOption: true,
          disableIpv6: false,
          showLan: 2,
        }),
      ).command,
    ).toBe("ip6 lan -l 2 -w 1 -d 2001:4860:4860::8888 -o 1 -f 0 -s 2");
    expect(firstFrame(ip6Lan.buildFrames({ action: "show" })).command).toBe("ip6 lan -s 0");
    expect(firstFrame(ip6Lan.buildFrames({ action: "show", lan: 3 })).command).toBe("ip6 lan -s 3");
    expect(firstFrame(ip6Lan.buildFrames({ action: "set", lan: 5 })).command).toBe("ip6 lan -l 5");
    expect(
      firstFrame(
        ip6Lan.buildFrames({ action: "set", lan: 2, otherOption: false, disableIpv6: true }),
      ).command,
    ).toBe("ip6 lan -l 2 -o 0 -f 1");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseLan(
        "%    Set LAN2!\
%    Set primary WAN1!\
",
      ),
    ).toEqual({
      raw: "%    Set LAN2!\
%    Set primary WAN1!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Lan, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Lan.buildFrames({ action: "show" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%    Set LAN2!\
%    Set primary WAN1!\
",
    );

    expect(ip6Lan.parse([exchange(stdout)])).toEqual({
      raw: "%    Set LAN2!\
%    Set primary WAN1!",
    });
    expect(command).toBe("ip6 lan -s 0");

    await expectClosedTransportFailure(command);
  });
});
