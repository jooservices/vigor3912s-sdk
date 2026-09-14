import { describe, expect, it } from "vitest";

import { ipBgpStaticShow } from "../../../src/domains/ip.js";
import { parseBgpStaticShow } from "../../../src/internal/parsers/ip/bgp-static-show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.bgp.static.show -- ip bgp static show", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipBgpStaticShow.buildFrames()).command).toBe("ip bgp static show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBgpStaticShow("BGP static networks:\n")).toEqual({
      raw: "BGP static networks:",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipBgpStaticShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipBgpStaticShow.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "BGP static networks:\n");

    expect(stdout).toBe("BGP static networks:\n");

    expect(ipBgpStaticShow.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
