import { describe, expect, it } from "vitest";

import { ip6Pneigh } from "../../../src/domains/ip6.js";
import { parsePneigh } from "../../../src/internal/parsers/ip6/pneigh.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.pneigh", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(
        ip6Pneigh.buildFrames({
          action: "set",
          address: "FE80::250:7FFF:FE12:300",
          interfaceLabel: "LAN1",
        }),
      ).command,
    ).toBe("ip6 pneigh -s FE80::250:7FFF:FE12:300 LAN1");
    expect(firstFrame(ip6Pneigh.buildFrames({ action: "show" })).command).toBe("ip6 pneigh -a");
    expect(
      firstFrame(
        ip6Pneigh.buildFrames({
          action: "delete",
          address: "FE80::250:7FFF:FE12:300",
          interfaceLabel: "LAN1",
        }),
      ).command,
    ).toBe("ip6 pneigh -d FE80::250:7FFF:FE12:300 LAN1");
    expect(
      firstFrame(
        ip6Pneigh.buildFrames({
          action: "show",
          address: "FE80::250:7FFF:FE12:300",
          interfaceLabel: "LAN1",
        }),
      ).command,
    ).toBe("ip6 pneigh -a FE80::250:7FFF:FE12:300 LAN1");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parsePneigh(
        "%       Neighbour FE80::250:7FFF:FE12:300 successfully added!\
",
      ),
    ).toEqual({ raw: "%       Neighbour FE80::250:7FFF:FE12:300 successfully added!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6Pneigh, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ip6Pneigh.buildFrames({
        action: "set",
        address: "FE80::250:7FFF:FE12:300",
        interfaceLabel: "LAN1",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "%       Neighbour FE80::250:7FFF:FE12:300 successfully added!\
",
    );

    expect(ip6Pneigh.parse([exchange(stdout)])).toEqual({
      raw: "%       Neighbour FE80::250:7FFF:FE12:300 successfully added!",
    });
    expect(command).toBe("ip6 pneigh -s FE80::250:7FFF:FE12:300 LAN1");

    await expectClosedTransportFailure(command);
  });
});
