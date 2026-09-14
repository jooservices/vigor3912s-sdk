import { describe, expect, it } from "vitest";

import { ipBgpShow } from "../../../src/domains/ip.js";
import { parseBgpShow } from "../../../src/internal/parsers/ip/bgp-show.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";
import { exchange } from "../../support/fake-transport.js";

describe("cli.ip.bgp.show -- ip bgp show", () => {
  it("builds the documented frame", () => {
    expect(firstFrame(ipBgpShow.buildFrames()).command).toBe("ip bgp show");
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseBgpShow("BGP is disable\nLocal autonomous system number: 0\n")).toEqual({
      raw: "BGP is disable\nLocal autonomous system number: 0",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(ipBgpShow, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(ipBgpShow.buildFrames()).command;
    const { stdout } = await dispatchThroughFakeTransport(
      command,
      "BGP is disable\nLocal autonomous system number: 0\n",
    );

    expect(stdout).toBe("BGP is disable\nLocal autonomous system number: 0\n");

    expect(ipBgpShow.parse([exchange(stdout)])).toEqual({ raw: stdout.trim() });
    await expectClosedTransportFailure(command);
  });
});
