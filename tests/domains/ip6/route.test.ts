import { describe, expect, it } from "vitest";

import { ip6Route } from "../../../src/domains/ip6.js";
import { parseRoute } from "../../../src/internal/parsers/ip6/route.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.route", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(
        ip6Route.buildFrames({
          action: "set",
          prefix: "FE80::250:7FFF:FE12:500",
          prefixLength: 16,
          gateway: "FE80::250:7FFF:FE12:100",
          interfaceLabel: "LAN1",
        }),
      ).command,
    ).toBe("ip6 route -s FE80::250:7FFF:FE12:500 16 FE80::250:7FFF:FE12:100 LAN1");
    expect(
      firstFrame(ip6Route.buildFrames({ action: "show", interfaceLabel: "LAN1" })).command,
    ).toBe("ip6 route -a LAN1");
    expect(firstFrame(ip6Route.buildFrames({ action: "show" })).command).toBe("ip6 route -a");
    expect(
      firstFrame(
        ip6Route.buildFrames({
          action: "set",
          prefix: "FE80::250:7FFF:FE12:500",
          prefixLength: 16,
          gateway: "FE80::250:7FFF:FE12:100",
          interfaceLabel: "LAN1",
          asDefault: true,
        }),
      ).command,
    ).toBe("ip6 route -s FE80::250:7FFF:FE12:500 16 FE80::250:7FFF:FE12:100 LAN1 -D");
    expect(
      firstFrame(
        ip6Route.buildFrames({
          action: "delete",
          prefix: "FE80::250:7FFF:FE12:500",
          prefixLength: 16,
        }),
      ).command,
    ).toBe("ip6 route -d FE80::250:7FFF:FE12:500 16");
    expect(firstFrame(ip6Route.buildFrames({ action: "clear" })).command).toBe("ip6 route -l");
    expect(() =>
      ip6Route.buildFrames({
        action: "set",
        prefix: "FE80::250:7FFF:FE12:500",
        prefixLength: 16,
        gateway: "FE80::250:7FFF:FE12:100",
        interfaceLabel: "not-an-interface",
      }),
    ).toThrow(/interfaceLabel/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseRoute(
        "%       Route FE80::250:7FFF:FE12:500/16 successfully added!\
",
      ),
    ).toEqual({ raw: "%       Route FE80::250:7FFF:FE12:500/16 successfully added!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Route, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ip6Route.buildFrames({ action: "show", interfaceLabel: "LAN1" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%       Route FE80::250:7FFF:FE12:500/16 successfully added!\
",
    );

    expect(ip6Route.parse([exchange(stdout)])).toEqual({
      raw: "%       Route FE80::250:7FFF:FE12:500/16 successfully added!",
    });
    expect(command).toBe("ip6 route -a LAN1");

    await expectClosedTransportFailure(command);
  });
});
