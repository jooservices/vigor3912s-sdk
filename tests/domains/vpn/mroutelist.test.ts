import { describe, expect, it } from "vitest";

import { vpnMrouteList } from "../../../src/domains/vpn.js";
import { parseMrouteList } from "../../../src/internal/parsers/vpn/mroutelist.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.mroute.list -- vpn mroute <index> list", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnMrouteList.buildFrames({ index: 1 }));

    expect(frame.command).toBe("vpn mroute 1 list");

    expect(() => vpnMrouteList.buildFrames({ index: 0 })).toThrow(/index/);
    expect(() => vpnMrouteList.buildFrames({ index: 501 })).toThrow(/index/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseMrouteList("% Route list for profile 1\n")).toEqual({
      raw: "% Route list for profile 1",
    });
  });

  it("links to the capability manifest as a read operation", () => {
    expectManifestLinkage(vpnMrouteList, "read");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnMrouteList.buildFrames({ index: 1 }));
    const { stdout } = await dispatchThroughFakeTransport(
      frame.command,
      "% Route list for profile 1\n",
    );

    expect(vpnMrouteList.parse([{ stdout, stderr: "" }])).toEqual({
      raw: "% Route list for profile 1",
    });

    await expectClosedTransportFailure(frame.command);
  });
});
