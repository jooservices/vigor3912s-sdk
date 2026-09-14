import { describe, expect, it } from "vitest";

import { ip6NeighS } from "../../../src/domains/ip6.js";
import { parseNeighS } from "../../../src/internal/parsers/ip6/neigh-s.js";
import { exchange } from "../../support/fake-transport.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.ip6.neigh.s", () => {
  it("builds the documented frame and rejects invalid input when applicable", () => {
    expect(
      firstFrame(
        ip6NeighS.buildFrames({
          address: "2001:2222:3333::1111",
          mac: "00:50:7F:11:ac:22",
          interfaceLabel: "WAN2",
        }),
      ).command,
    ).toBe("ip6 neigh -s 2001:2222:3333::1111 00:50:7F:11:ac:22 WAN2");
    expect(() =>
      ip6NeighS.buildFrames({
        address: "2001:2222:3333::1111",
        mac: "bad",
        interfaceLabel: "WAN2",
      }),
    ).toThrow(/mac/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(
      parseNeighS(
        "Neighbour 2001:2222:3333::1111 successfully added!\
",
      ),
    ).toEqual({ raw: "Neighbour 2001:2222:3333::1111 successfully added!" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(ip6NeighS, "write");
  });

  it("dispatches through the fake transport and fails when the session is closed", async () => {
    const command = firstFrame(
      ip6NeighS.buildFrames({
        address: "2001:2222:3333::1111",
        mac: "00:50:7F:11:ac:22",
        interfaceLabel: "WAN2",
      }),
    ).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "Neighbour 2001:2222:3333::1111 successfully added!\
",
    );

    expect(ip6NeighS.parse([exchange(stdout)])).toEqual({
      raw: "Neighbour 2001:2222:3333::1111 successfully added!",
    });
    expect(command).toBe("ip6 neigh -s 2001:2222:3333::1111 00:50:7F:11:ac:22 WAN2");

    await expectClosedTransportFailure(command);
  });
});
