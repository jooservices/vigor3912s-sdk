import { describe, expect, it } from "vitest";

import { vpnL2lSet } from "../../../src/domains/vpn.js";
import { parseL2lSet } from "../../../src/internal/parsers/vpn/l2lset.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vpn.l2lset -- vpn l2lset <index> <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    const frame = firstFrame(vpnL2lSet.buildFrames({ index: 1, param: "peerid 10226" }));

    expect(frame.command).toBe("vpn l2lset 1 peerid 10226");

    expect(() => vpnL2lSet.buildFrames({ index: 0, param: "x" })).toThrow(/index/);
    expect(() => vpnL2lSet.buildFrames({ index: 501, param: "x" })).toThrow(/index/);
    expect(() => vpnL2lSet.buildFrames({ index: 1, param: "" })).toThrow(/param/);
    expect(() => vpnL2lSet.buildFrames({ index: 1, param: "x;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseL2lSet("% Set OK\n")).toEqual({ raw: "% Set OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vpnL2lSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const frame = firstFrame(vpnL2lSet.buildFrames({ index: 1, param: "peerid 10226" }));
    const { stdout } = await dispatchThroughFakeTransport(frame.command, "% Set OK\n");

    expect(vpnL2lSet.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Set OK" });

    await expectClosedTransportFailure(frame.command);
  });
});
