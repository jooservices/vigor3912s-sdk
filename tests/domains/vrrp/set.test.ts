import { describe, expect, it } from "vitest";

import { vrrpSet } from "../../../src/domains/vrrp.js";
import { parseVrrpSet } from "../../../src/internal/parsers/vrrp/set.js";
import {
  dispatchThroughFakeTransport,
  expectClosedTransportFailure,
  expectManifestLinkage,
  firstFrame,
} from "./support.js";

describe("cli.vrrp.set -- vrrp set <param>", () => {
  it("builds the documented frame and rejects invalid input", () => {
    expect(firstFrame(vrrpSet.buildFrames({ param: "vrid 1" })).command).toBe("vrrp set vrid 1");

    expect(() => vrrpSet.buildFrames({ param: "" })).toThrow(/param/);
    expect(() => vrrpSet.buildFrames({ param: "x;rm" })).toThrow(/param/);
  });

  it("parses the documented acknowledgement text (synthetic sample)", () => {
    expect(parseVrrpSet("% Set OK\n")).toEqual({ raw: "% Set OK" });
  });

  it("links to the capability manifest as a write operation", () => {
    expectManifestLinkage(vrrpSet, "write");
  });

  it("round-trips through a fake transport and surfaces closed-session failure", async () => {
    const command = firstFrame(vrrpSet.buildFrames({ param: "vrid 1" })).command;
    const { stdout } = await dispatchThroughFakeTransport(command, "% Set OK\n");

    expect(vrrpSet.parse([{ stdout, stderr: "" }])).toEqual({ raw: "% Set OK" });

    await expectClosedTransportFailure(command);
  });
});
