import { describe, expect, it } from "vitest";

import { ip6Radvd } from "../../../src/domains/ip6.js";
import { parseRadvd } from "../../../src/internal/parsers/ip6/radvd.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.radvd", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(ip6Radvd.buildFrames({ action: "enable", interfaceLabel: "LAN1", enabled: true }))
        .command,
    ).toBe("ip6 radvd LAN1 -s 1");
    expect(
      firstFrame(
        ip6Radvd.buildFrames({
          action: "setDefaultLifetime",
          interfaceLabel: "LAN1",
          seconds: 1800,
        }),
      ).command,
    ).toBe("ip6 radvd LAN1 -d 1800");
    expect(
      firstFrame(ip6Radvd.buildFrames({ action: "enable", interfaceLabel: "LAN1", enabled: false }))
        .command,
    ).toBe("ip6 radvd LAN1 -s 0");
    expect(
      firstFrame(ip6Radvd.buildFrames({ action: "view", interfaceLabel: "LAN1" })).command,
    ).toBe("ip6 radvd LAN1 -v");
    expect(
      firstFrame(ip6Radvd.buildFrames({ action: "viewRa", interfaceLabel: "LAN1" })).command,
    ).toBe("ip6 radvd LAN1 -V");
    expect(firstFrame(ip6Radvd.buildFrames({ action: "viewRa" })).command).toBe("ip6 radvd -V");
    expect(() => ip6Radvd.buildFrames({ action: "view", interfaceLabel: "WAN1" })).toThrow(
      /interfaceLabel/,
    );
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseRadvd(
        "% [LAN1] setting !\
%    Enable LAN1 radvd OK!\
",
      ),
    ).toEqual({
      raw: "% [LAN1] setting !\
%    Enable LAN1 radvd OK!",
    });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Radvd, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ip6Radvd.buildFrames({ action: "enable", interfaceLabel: "LAN1", enabled: true }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "% [LAN1] setting !\
%    Enable LAN1 radvd OK!\
",
    );

    expect(ip6Radvd.parse([exchange(stdout)])).toEqual({
      raw: "% [LAN1] setting !\
%    Enable LAN1 radvd OK!",
    });
    expect(command).toBe("ip6 radvd LAN1 -s 1");

    await expectClosedTransportFailure(command);
  });
});
