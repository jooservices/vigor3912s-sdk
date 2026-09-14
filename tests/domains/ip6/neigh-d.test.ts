import { describe, expect, it } from "vitest";

import { ip6NeighD } from "../../../src/domains/ip6.js";
import { parseNeighD } from "../../../src/internal/parsers/ip6/neigh-d.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.neigh.d", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(
        ip6NeighD.buildFrames({
          address: "2001:2222:3333::1111",
          interfaceLabel: "WAN2",
        }),
      ).command,
    ).toBe("ip6 neigh -d 2001:2222:3333::1111 WAN2");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNeighD(
        "Neighbour deleted\
",
      ),
    ).toEqual({ raw: "Neighbour deleted" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6NeighD, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ip6NeighD.buildFrames({ address: "2001:2222:3333::1111", interfaceLabel: "WAN2" }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Neighbour deleted\
",
    );

    expect(ip6NeighD.parse([exchange(stdout)])).toEqual({ raw: "Neighbour deleted" });
    expect(command).toBe("ip6 neigh -d 2001:2222:3333::1111 WAN2");

    await expectClosedTransportFailure(command);
  });
});
