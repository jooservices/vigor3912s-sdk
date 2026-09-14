import { describe, expect, it } from "vitest";

import { ip6NeighA } from "../../../src/domains/ip6.js";
import { parseNeighA } from "../../../src/internal/parsers/ip6/neigh-a.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.neigh.a", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(firstFrame(ip6NeighA.buildFrames({})).command).toBe("ip6 neigh -a");
    expect(firstFrame(ip6NeighA.buildFrames({ interfaceLabel: "LAN1" })).command).toBe(
      "ip6 neigh -a LAN1",
    );
    expect(
      firstFrame(
        ip6NeighA.buildFrames({ address: "FE80::250:7FFF:FE12:300", interfaceLabel: "LAN1" }),
      ).command,
    ).toBe("ip6 neigh -a FE80::250:7FFF:FE12:300 LAN1");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNeighA(
        "I/F  ADDR                                            MAC                 STATE\
LAN1 ::                                                          NONE\
",
      ),
    ).toEqual({
      raw: "I/F  ADDR                                            MAC                 STATE\
LAN1 ::                                                          NONE",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ip6NeighA, "read");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(ip6NeighA.buildFrames({})).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "I/F  ADDR                                            MAC                 STATE\
LAN1 ::                                                          NONE\
",
    );

    expect(ip6NeighA.parse([exchange(stdout)])).toEqual({
      raw: "I/F  ADDR                                            MAC                 STATE\
LAN1 ::                                                          NONE",
    });
    expect(command).toBe("ip6 neigh -a");

    await expectClosedTransportFailure(command);
  });
});
