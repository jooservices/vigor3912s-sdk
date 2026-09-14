import { describe, expect, it } from "vitest";

import { ip6Bandwidth } from "../../../src/domains/ip6.js";
import { parseBandwidth } from "../../../src/internal/parsers/ip6/bandwidth.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.bandwidth", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6Bandwidth.buildFrames({ action: "on" })).command).toBe("ip6 bandwidth on");
    expect(
      firstFrame(
        ip6Bandwidth.buildFrames({
          action: "add",
          ipStart: "2001:ABCD::2",
          ipEnd: "2001:ABCD::10",
          txRate: "512",
          rxRate: "5M",
          shared: true,
        }),
      ).command,
    ).toBe("ip6 bandwidth add 2001:ABCD::2-2001:ABCD::10 512 5M shared");
    expect(firstFrame(ip6Bandwidth.buildFrames({ action: "status" })).command).toBe(
      "ip6 bandwidth status",
    );
    expect(firstFrame(ip6Bandwidth.buildFrames({ action: "off" })).command).toBe(
      "ip6 bandwidth off",
    );
    expect(
      firstFrame(ip6Bandwidth.buildFrames({ action: "default", txRate: "512", rxRate: "5M" }))
        .command,
    ).toBe("ip6 bandwidth default 512 5M");
    expect(firstFrame(ip6Bandwidth.buildFrames({ action: "show" })).command).toBe(
      "ip6 bandwidth show",
    );
    expect(
      firstFrame(ip6Bandwidth.buildFrames({ action: "delete", ipStart: "2001:ABCD::2" })).command,
    ).toBe("ip6 bandwidth del 2001:ABCD::2");
    expect(firstFrame(ip6Bandwidth.buildFrames({ action: "deleteAll" })).command).toBe(
      "ip6 bandwidth del all",
    );
    expect(() =>
      ip6Bandwidth.buildFrames({ action: "default", txRate: "not-a-rate", rxRate: "5M" }),
    ).toThrow(/txRate/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseBandwidth(
        "Current ip6 Bandwidth limit is turn on\
",
      ),
    ).toEqual({ raw: "Current ip6 Bandwidth limit is turn on" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Bandwidth, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Bandwidth.buildFrames({ action: "status" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Current ip6 Bandwidth limit is turn on\
",
    );

    expect(ip6Bandwidth.parse([exchange(stdout)])).toEqual({
      raw: "Current ip6 Bandwidth limit is turn on",
    });
    expect(command).toBe("ip6 bandwidth status");

    await expectClosedTransportFailure(command);
  });
});
