import { describe, expect, it } from "vitest";

import { ip6Online } from "../../../src/domains/ip6.js";
import { parseOnline } from "../../../src/internal/parsers/ip6/online.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.online", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6Online.buildFrames({ wan: "WAN1" })).command).toBe("ip6 online WAN1");
    expect(() => ip6Online.buildFrames({ wan: "LAN1" })).toThrow(/wan/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseOnline(
        " % WAN1 online status :\
 % IPv6 WAN1 Disabled\
",
      ),
    ).toEqual({
      raw: "% WAN1 online status :\
 % IPv6 WAN1 Disabled",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ip6Online, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6Online.buildFrames({ wan: "WAN1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      " % WAN1 online status :\
 % IPv6 WAN1 Disabled\
",
    );

    expect(ip6Online.parse([exchange(stdout)])).toEqual({
      raw: "% WAN1 online status :\
 % IPv6 WAN1 Disabled",
    });
    expect(command).toBe("ip6 online WAN1");

    await expectClosedTransportFailure(command);
  });
});
