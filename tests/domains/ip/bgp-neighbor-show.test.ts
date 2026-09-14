import { describe, expect, it } from "vitest";

import { ipBgpNeighborShow } from "../../../src/domains/ip.js";
import { parseBgpNeighborShow } from "../../../src/internal/parsers/ip/bgp-neighbor-show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.bgp.neighbor.show -- ip bgp neighbor show", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(ipBgpNeighborShow.buildFrames({ action: "all" })).command).toBe(
      "ip bgp neighbor show all",
    );
    expect(firstFrame(ipBgpNeighborShow.buildFrames({ action: "index", idx: 1 })).command).toBe(
      "ip bgp neighbor 1 show",
    );

    expect(() => ipBgpNeighborShow.buildFrames({ action: "index", idx: 0 })).toThrow(/idx/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBgpNeighborShow("BGP neighbor:\nIdx Mode As Number\n")).toEqual({
      raw: "BGP neighbor:\nIdx Mode As Number",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipBgpNeighborShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipBgpNeighborShow.buildFrames({ action: "all" })).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "BGP neighbor:\nIdx Mode As Number\n",
    );

    expect(stdout).toBe("BGP neighbor:\nIdx Mode As Number\n");

    expect(ipBgpNeighborShow.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
